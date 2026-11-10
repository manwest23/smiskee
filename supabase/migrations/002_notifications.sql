-- =====================================================================
-- SMISKEE notifications (run after schema.sql)
--
-- What this adds
--   * notifications       : the in-app list (bell) and the queue for phone push
--   * push_subscriptions  : each phone/browser that turned on push
--   * profiles.notify     : each person's on/off choices per notification type
--   * sessions.starts_at  : real start times, so sessions go live on their own
--   * scheduled jobs (pg_cron, Malaysia time):
--       - weekdays 9:00 AM  daily check-in reminder (only if not checked in)
--       - Fridays  5:00 PM  "your weekly recap is ready"
--       - daily   10:00 AM  voucher expiring in 3 days
--       - every 5 minutes   leader session starting soon / now live
--       - every minute      hand queued notifications to the push sender
--   * the push sender itself is the Edge Function in supabase/functions/send-push
--
-- Safe to run more than once.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- ---------- private settings (never readable by the app) ----------
create table if not exists public.app_secrets (
  key         text primary key,
  value       text not null,
  created_at  timestamptz not null default now()
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (key, value) values
  ('cron_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  -- the Edge Functions address of this Supabase project
  ('functions_url', 'https://aroseiknhnrczwagnzau.supabase.co/functions/v1')
on conflict (key) do nothing;

-- ---------- notification preferences ----------
alter table public.profiles
  add column if not exists notify jsonb not null
  default '{"checkin": true, "session": true, "recap": true, "coupon": true}'::jsonb;

-- ---------- tables ----------
create table if not exists public.notifications (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null,
  title        text not null,
  body         text not null default '',
  url          text not null default '#home',
  dedupe_key   text,
  push_status  text not null default 'pending'
               check (push_status in ('pending','sending','sent','skip','failed','expired')),
  claimed_at   timestamptz,
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index if not exists notifications_user on public.notifications (user_id, created_at desc);
create index if not exists notifications_pending on public.notifications (push_status) where push_status in ('pending','sending');

create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;
drop policy if exists own_notifications on public.notifications;
create policy own_notifications on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists own_push_subs on public.push_subscriptions;
create policy own_push_subs on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
revoke all on public.notifications, public.push_subscriptions from anon;
grant select on public.notifications, public.push_subscriptions to authenticated;

-- ---------- sessions get real start times ----------
alter table public.sessions add column if not exists starts_at timestamptz not null default now();

create or replace function public.session_is_live(p_starts timestamptz) returns boolean
language sql stable as $$ select p_starts <= now() and p_starts > now() - interval '3 hours' $$;

-- ---------- creating notifications ----------
-- Internal helper. Respects each person's choices for the optional types.
create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text,
                                         p_url text, p_key text, p_push boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind in ('checkin','session','recap','coupon')
     and not coalesce((select (notify->>p_kind)::boolean from public.profiles where id = p_user), true) then
    return;
  end if;
  insert into public.notifications (user_id, kind, title, body, url, dedupe_key, push_status)
  values (p_user, p_kind, p_title, p_body, p_url, p_key, case when p_push then 'pending' else 'skip' end)
  on conflict (user_id, dedupe_key) do nothing;
end $$;

-- KL wall-clock time for a choice in the "When" menu
create or replace function public.session_start_for(p_when text) returns timestamptz
language plpgsql stable as $$
declare
  local_now timestamp := now() at time zone 'Asia/Kuala_Lumpur';
  d date;
  dow int;
  t time;
begin
  if p_when in ('now', 'Live now') then return now(); end if;
  if p_when in ('tomorrow-1230', 'Tomorrow · 12:30 PM') then
    return ((local_now::date + 1) + time '12:30') at time zone 'Asia/Kuala_Lumpur';
  end if;
  dow := case when p_when in ('thu-1630', 'Thu · 4:30 PM') then 4
              when p_when in ('fri-1630', 'Fri · 4:30 PM') then 5 end;
  if dow is null then raise exception 'Choose when the session starts.'; end if;
  t := time '16:30';
  d := local_now::date + ((dow - extract(isodow from local_now)::int + 7) % 7);
  if d = local_now::date and local_now::time >= t then d := d + 7; end if;
  return (d + t) at time zone 'Asia/Kuala_Lumpur';
end $$;

drop function if exists public.list_sessions();
create or replace function public.list_sessions()
returns table (id uuid, name text, when_label text, live boolean, host_name text,
               host_title text, is_mine boolean, created_at timestamptz, starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.when_label, public.session_is_live(s.starts_at),
         p.full_name, 'Team leader · ' || p.department, s.host_id = public._uid(), s.created_at, s.starts_at
    from public.sessions s join public.profiles p on p.id = s.host_id
   where s.starts_at > now() - interval '3 hours'
     and s.starts_at < now() + interval '8 days'
   order by public.session_is_live(s.starts_at) desc, s.starts_at
   limit 20;
$$;

create or replace function public.host_session(p_name text, p_when text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := public._uid();
  sid   uuid;
  st    timestamptz := public.session_start_for(p_when);
  nm    text := coalesce(nullif(trim(p_name), ''), 'Team Trivia');
  host  text;
begin
  select full_name into host from public.profiles where id = uid and role = 'leader';
  if not found then raise exception 'Only team leaders can host sessions.'; end if;
  insert into public.sessions (host_id, name, when_label, live, starts_at)
  values (uid, nm, p_when, st <= now(), st)
  returning id into sid;
  if st <= now() then
    perform public.notify(p.id, 'session', host || ' is hosting a live round',
                          'Join "' || nm || '" now for double points.', '#games', 'session-live:' || sid)
       from public.profiles p where p.id <> uid;
  end if;
  return sid;
end $$;

create or replace function public.award_session(p_session uuid, p_score int)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := public._uid();
  d    date := public.my_today();
  host text;
  pts  int := least(greatest(coalesce(p_score, 0), 0), 5) * 60;
  n    int;
begin
  select p.full_name into host
    from public.sessions s join public.profiles p on p.id = s.host_id
   where s.id = p_session and public.session_is_live(s.starts_at);
  if not found then raise exception 'This session is not live right now.'; end if;
  if pts > 0 then
    insert into public.ledger (user_id, day, kind, award_key, title, points)
    values (uid, d, 'session', 'session:' || p_session, 'Leader round with ' || host, pts)
    on conflict (user_id, award_key) do nothing;
    get diagnostics n = row_count;
    if n = 0 then pts := 0; end if;
  end if;
  insert into public.plays (user_id, day, game, points) values (uid, d, 'session', pts);
  insert into public.badges (user_id, badge) values (uid, 'Leader Round') on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    perform public.notify(uid, 'badge', 'New badge: Leader Round',
                          'Thanks for joining a leader session. See it on your profile.', '#profile', 'badge:Leader Round');
  end if;
  return pts;
end $$;

-- ---------- app actions ----------
create or replace function public.get_push_public_key() returns text
language sql stable security definer set search_path = public as $$
  select value from public.app_secrets where key = 'vapid_public';
$$;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_agent text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := public._uid();
begin
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then raise exception 'Invalid push address.'; end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, user_agent)
  values (p_endpoint, uid, p_p256dh, p_auth, left(p_agent, 300))
  on conflict (endpoint) do update set user_id = uid, p256dh = excluded.p256dh, auth = excluded.auth,
    user_agent = excluded.user_agent, created_at = now();
end $$;

create or replace function public.delete_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = public._uid();
$$;

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = public._uid() and read_at is null;
$$;

create or replace function public.set_notify_prefs(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := public._uid();
  k    text;
  cur  jsonb;
begin
  select notify into cur from public.profiles where id = uid;
  foreach k in array array['checkin','session','recap','coupon'] loop
    if p ? k and jsonb_typeof(p->k) = 'boolean' then cur := jsonb_set(cur, array[k], p->k); end if;
  end loop;
  update public.profiles set notify = cur where id = uid;
  return cur;
end $$;

create or replace function public.send_test_notification() returns void
language sql security definer set search_path = public as $$
  select public.notify(public._uid(), 'test', 'Notifications are on',
    'This is how SMISKEE reminders will look on this device.', '#home', null);
$$;

-- ---------- scheduled jobs ----------
create or replace function public.job_checkin_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare d date := public.my_today(); n int;
begin
  if extract(isodow from d) > 5 then return 0; end if;
  perform public.notify(p.id, 'checkin', 'Time for your daily check-in',
    'How are you feeling today? It takes 20 seconds and earns 20 points.', '#checkin', 'checkin:' || d)
    from public.profiles p
   where not exists (select 1 from public.checkins c where c.user_id = p.id and c.day = d);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.job_weekly_recap() returns int
language plpgsql security definer set search_path = public as $$
declare wk date := public.week_start(public.my_today()); n int;
begin
  perform public.notify(p.id, 'recap', 'Your weekly recap is ready',
    'See how your week went and pick your intentions for next week.', '#recap', 'recap:' || wk)
    from public.profiles p
   where exists (select 1 from public.checkins c where c.user_id = p.id and c.day >= wk);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.job_coupon_expiry() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform public.notify(c.user_id, 'coupon', c.brand || ' voucher expires soon',
    'Your code ' || c.code || ' expires on ' || to_char(c.expires_at at time zone 'Asia/Kuala_Lumpur', 'FMDD Mon') || '. Use it before then.',
    '#rewards', 'coupon:' || c.id)
    from public.coupons c
   where c.expires_at > now() and c.expires_at <= now() + interval '3 days';
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.job_sessions() returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; m int;
begin
  -- starting within 15 minutes: people who tapped "Remind me"
  perform public.notify(r.user_id, 'session', '"' || s.name || '" starts soon',
    p.full_name || '''s round starts at ' || to_char(s.starts_at at time zone 'Asia/Kuala_Lumpur', 'FMHH12:MI AM') || '. Get ready to join.',
    '#games', 'session-soon:' || s.id)
    from public.sessions s
    join public.profiles p on p.id = s.host_id
    join public.session_reminders r on r.session_id = s.id
   where s.starts_at > now() and s.starts_at <= now() + interval '15 minutes';
  get diagnostics m = row_count; n := n + m;
  -- just went live: everyone except the host
  perform public.notify(u.id, 'session', p.full_name || ' is hosting a live round',
    'Join "' || s.name || '" now for double points.', '#games', 'session-live:' || s.id)
    from public.sessions s
    join public.profiles p on p.id = s.host_id
    join public.profiles u on u.id <> s.host_id
   where s.starts_at <= now() and s.starts_at > now() - interval '10 minutes';
  get diagnostics m = row_count; n := n + m;
  return n;
end $$;

create or replace function public.job_cleanup() returns void
language sql security definer set search_path = public as $$
  delete from public.notifications where created_at < now() - interval '60 days';
$$;

-- Ask the Edge Function to send queued phone notifications
create or replace function public.job_flush_push() returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from public.notifications where push_status = 'pending' and created_at > now() - interval '12 hours')
     or not exists (select 1 from public.app_secrets where key = 'vapid_public') then
    perform net.http_post(
      url := (select value from public.app_secrets where key = 'functions_url') || '/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json',
                   'x-smiskee-cron', (select value from public.app_secrets where key = 'cron_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000);
  end if;
end $$;

-- ---------- used only by the push sender (service role) ----------
create or replace function public.push_check_secret(p_secret text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_secrets where key = 'cron_secret' and value = p_secret and length(p_secret) > 20);
$$;

create or replace function public.push_get_vapid() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'public',  (select value from public.app_secrets where key = 'vapid_public'),
    'private', (select value from public.app_secrets where key = 'vapid_private_jwk'));
$$;

create or replace function public.push_set_vapid(p_public text, p_private text) returns void
language sql security definer set search_path = public as $$
  insert into public.app_secrets (key, value) values ('vapid_public', p_public), ('vapid_private_jwk', p_private)
  on conflict (key) do nothing;
$$;

create or replace function public.push_claim_batch(p_limit int default 200) returns json
language plpgsql security definer set search_path = public as $$
declare ids bigint[]; result json;
begin
  update public.notifications set push_status = 'pending', claimed_at = null
   where push_status = 'sending' and claimed_at < now() - interval '5 minutes';
  update public.notifications set push_status = 'expired'
   where push_status = 'pending' and created_at < now() - interval '12 hours';
  update public.notifications n set push_status = 'skip'
   where push_status = 'pending' and not exists (select 1 from public.push_subscriptions s where s.user_id = n.user_id);
  select array_agg(id) into ids from (
    select id from public.notifications where push_status = 'pending' order by id limit p_limit for update skip locked) x;
  if ids is null then return '[]'::json; end if;
  update public.notifications set push_status = 'sending', claimed_at = now() where id = any(ids);
  select json_agg(json_build_object(
           'id', n.id, 'kind', n.kind, 'title', n.title, 'body', n.body, 'url', n.url,
           'subs', (select json_agg(json_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
                      from public.push_subscriptions s where s.user_id = n.user_id)))
    into result
    from public.notifications n where n.id = any(ids);
  return coalesce(result, '[]'::json);
end $$;

create or replace function public.push_finish(p_results jsonb, p_gone text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.notifications n set push_status = r->>'status'
    from jsonb_array_elements(coalesce(p_results, '[]'::jsonb)) r
   where n.id = (r->>'id')::bigint and r->>'status' in ('sent','failed','skip');
  delete from public.push_subscriptions where endpoint = any(coalesce(p_gone, '{}'));
end $$;

-- ---------- who may call what ----------
do $$
declare f text;
begin
  -- signed-in app users
  foreach f in array array[
    'public.list_sessions()', 'public.host_session(text, text)', 'public.award_session(uuid, int)',
    'public.get_push_public_key()', 'public.save_push_subscription(text, text, text, text)',
    'public.delete_push_subscription(text)', 'public.mark_notifications_read()',
    'public.set_notify_prefs(jsonb)', 'public.send_test_notification()']
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  -- internal only
  foreach f in array array[
    'public.notify(uuid, text, text, text, text, text, boolean)', 'public.job_checkin_reminders()',
    'public.job_weekly_recap()', 'public.job_coupon_expiry()', 'public.job_sessions()',
    'public.job_cleanup()', 'public.job_flush_push()', 'public.session_start_for(text)']
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
  -- the push sender (service role) only
  foreach f in array array[
    'public.push_check_secret(text)', 'public.push_get_vapid()', 'public.push_set_vapid(text, text)',
    'public.push_claim_batch(int)', 'public.push_finish(jsonb, text[])']
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- ---------- schedules (pg_cron runs in UTC; Malaysia is UTC+8) ----------
do $$
declare j text;
begin
  foreach j in array array['smiskee-checkin','smiskee-recap','smiskee-coupons','smiskee-sessions','smiskee-push','smiskee-cleanup'] loop
    perform cron.unschedule(jobid) from cron.job where jobname = j;
  end loop;
end $$;
select cron.schedule('smiskee-checkin',  '0 1 * * 1-5', 'select public.job_checkin_reminders()');  -- 9:00 AM MYT, Mon-Fri
select cron.schedule('smiskee-recap',    '0 9 * * 5',   'select public.job_weekly_recap()');       -- 5:00 PM MYT, Friday
select cron.schedule('smiskee-coupons',  '0 2 * * *',   'select public.job_coupon_expiry()');      -- 10:00 AM MYT daily
select cron.schedule('smiskee-sessions', '*/5 * * * *', 'select public.job_sessions()');
select cron.schedule('smiskee-push',     '* * * * *',   'select public.job_flush_push()');
select cron.schedule('smiskee-cleanup',  '30 19 * * *', 'select public.job_cleanup()');            -- 3:30 AM MYT
