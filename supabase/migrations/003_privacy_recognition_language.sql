-- =====================================================================
-- SMISKEE: privacy, recovery codes, appreciation, catch-ups, language
-- Run after schema.sql and 002_notifications.sql. Safe to run again.
--
--   * profiles.lang / consent_at / consent_version
--   * delete_my_account()        : removes the person and all their data
--   * recovery codes             : self-service password reset (hashed codes,
--                                  5 wrong tries per hour per staff ID)
--   * kudos                      : peer recognition with badges and points
--   * request_catchup()          : ask your department's leaders for a chat,
--                                  without sharing any stress data
--   * notifications are written in each person's language (en / ms)
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- profile fields ----------
alter table public.profiles add column if not exists lang text not null default 'en';
alter table public.profiles drop constraint if exists profiles_lang_check;
alter table public.profiles add constraint profiles_lang_check check (lang in ('en','ms'));
alter table public.profiles add column if not exists consent_at timestamptz;
alter table public.profiles add column if not exists consent_version text;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, staff_id, department, role, lang, consent_at, consent_version)
  values (
    new.id,
    trim(coalesce(m->>'full_name', '')),
    upper(trim(coalesce(m->>'staff_id', ''))),
    coalesce(m->>'department', 'Digital Banking'),
    case when m->>'role' = 'leader' then 'leader' else 'employee' end,
    case when m->>'lang' = 'ms' then 'ms' else 'en' end,
    case when m->>'consent_version' is not null then now() end,
    m->>'consent_version'
  );
  return new;
end $$;

-- ---------- language helpers ----------
create or replace function public.tr(p_user uuid, p_en text, p_ms text) returns text
language sql stable security definer set search_path = public as $$
  select case when (select lang from public.profiles where id = p_user) = 'ms' then p_ms else p_en end;
$$;

create or replace function public.badge_ms(p_badge text) returns text
language sql immutable as $$
  select case p_badge
    when 'Team Player' then 'Pemain Berpasukan' when 'Positive Energy' then 'Tenaga Positif'
    when 'Customer Hero' then 'Wira Pelanggan' when 'Problem Solver' then 'Penyelesai Masalah'
    when 'Mentor' then 'Mentor' when 'Innovation' then 'Inovasi'
    when 'Leader Round' then 'Pusingan Pemimpin' else p_badge end;
$$;

create or replace function public.kl_time(p_ts timestamptz, p_lang text) returns text
language sql stable as $$
  select case when p_lang = 'ms'
    then to_char(p_ts at time zone 'Asia/Kuala_Lumpur', 'FMHH12:MI') ||
         case when extract(hour from p_ts at time zone 'Asia/Kuala_Lumpur') < 12 then ' pagi' else ' petang' end
    else to_char(p_ts at time zone 'Asia/Kuala_Lumpur', 'FMHH12:MI AM') end;
$$;

create or replace function public.kl_date(p_ts timestamptz, p_lang text) returns text
language sql stable as $$
  select extract(day from p_ts at time zone 'Asia/Kuala_Lumpur')::int || ' ' ||
    (case when p_lang = 'ms'
      then array['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis']
      else array['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] end)
    [extract(month from p_ts at time zone 'Asia/Kuala_Lumpur')::int];
$$;

create or replace function public.lang_of(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select lang from public.profiles where id = p_user), 'en');
$$;

-- ---------- notifications, now in each person's language ----------
create or replace function public.job_checkin_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare d date := public.my_today(); n int;
begin
  if extract(isodow from d) > 5 then return 0; end if;
  perform public.notify(p.id, 'checkin',
    public.tr(p.id, 'Time for your daily check-in', 'Masa untuk daftar masuk harian'),
    public.tr(p.id, 'How are you feeling today? It takes 20 seconds and earns 20 points.',
                    'Apa khabar hari ini? Hanya 20 saat dan anda dapat 20 mata.'),
    '#checkin', 'checkin:' || d)
    from public.profiles p
   where not exists (select 1 from public.checkins c where c.user_id = p.id and c.day = d);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.job_weekly_recap() returns int
language plpgsql security definer set search_path = public as $$
declare wk date := public.week_start(public.my_today()); n int;
begin
  perform public.notify(p.id, 'recap',
    public.tr(p.id, 'Your weekly recap is ready', 'Ringkasan mingguan anda sudah sedia'),
    public.tr(p.id, 'See how your week went and pick your intentions for next week.',
                    'Lihat perjalanan minggu anda dan pilih niat untuk minggu depan.'),
    '#recap', 'recap:' || wk)
    from public.profiles p
   where exists (select 1 from public.checkins c where c.user_id = p.id and c.day >= wk);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.job_coupon_expiry() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform public.notify(c.user_id, 'coupon',
    public.tr(c.user_id, c.brand || ' voucher expires soon', 'Baucar ' || c.brand || ' hampir tamat'),
    public.tr(c.user_id,
      'Your code ' || c.code || ' expires on ' || public.kl_date(c.expires_at, 'en') || '. Use it before then.',
      'Kod ' || c.code || ' tamat pada ' || public.kl_date(c.expires_at, 'ms') || '. Gunakannya sebelum tarikh itu.'),
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
  perform public.notify(r.user_id, 'session',
    public.tr(r.user_id, '"' || s.name || '" starts soon', '"' || s.name || '" akan bermula'),
    public.tr(r.user_id,
      p.full_name || '''s round starts at ' || public.kl_time(s.starts_at, 'en') || '. Get ready to join.',
      'Pusingan ' || p.full_name || ' bermula pada ' || public.kl_time(s.starts_at, 'ms') || '. Bersedia untuk menyertai.'),
    '#games', 'session-soon:' || s.id)
    from public.sessions s
    join public.profiles p on p.id = s.host_id
    join public.session_reminders r on r.session_id = s.id
   where s.starts_at > now() and s.starts_at <= now() + interval '15 minutes';
  get diagnostics m = row_count; n := n + m;
  perform public.notify(u.id, 'session',
    public.tr(u.id, p.full_name || ' is hosting a live round', p.full_name || ' sedang mengadakan pusingan langsung'),
    public.tr(u.id, 'Join "' || s.name || '" now for double points.', 'Sertai "' || s.name || '" sekarang untuk mata berganda.'),
    '#games', 'session-live:' || s.id)
    from public.sessions s
    join public.profiles p on p.id = s.host_id
    join public.profiles u on u.id <> s.host_id
   where s.starts_at <= now() and s.starts_at > now() - interval '10 minutes';
  get diagnostics m = row_count; n := n + m;
  return n;
end $$;

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
    perform public.notify(p.id, 'session',
      public.tr(p.id, host || ' is hosting a live round', host || ' sedang mengadakan pusingan langsung'),
      public.tr(p.id, 'Join "' || nm || '" now for double points.', 'Sertai "' || nm || '" sekarang untuk mata berganda.'),
      '#games', 'session-live:' || sid)
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
    perform public.notify(uid, 'badge',
      public.tr(uid, 'New badge: Leader Round', 'Lencana baharu: Pusingan Pemimpin'),
      public.tr(uid, 'Thanks for joining a leader session. See it on your profile.',
                     'Terima kasih kerana menyertai sesi pemimpin. Lihat lencana di profil anda.'),
      '#profile', 'badge:Leader Round');
  end if;
  return pts;
end $$;

create or replace function public.send_test_notification() returns void
language sql security definer set search_path = public as $$
  select public.notify(public._uid(), 'test',
    public.tr(public._uid(), 'Notifications are on', 'Pemberitahuan telah dihidupkan'),
    public.tr(public._uid(), 'This is how SMISKEE reminders will look on this device.',
                             'Beginilah rupa peringatan SMISKEE pada peranti ini.'),
    '#home', null);
$$;

-- ---------- language and consent ----------
create or replace function public.set_language(p_lang text) returns void
language sql security definer set search_path = public as $$
  update public.profiles set lang = case when p_lang = 'ms' then 'ms' else 'en' end where id = public._uid();
$$;

create or replace function public.give_consent(p_version text) returns timestamptz
language sql security definer set search_path = public as $$
  update public.profiles set consent_at = now(), consent_version = left(p_version, 40)
   where id = public._uid() returning consent_at;
$$;

-- Deletes the signed-in person's login and, through cascades, every row about them.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := public._uid();
begin
  delete from auth.users where id = uid;
end $$;

-- ---------- recovery codes ----------
create table if not exists public.recovery_codes (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  code_hash   text not null,
  created_at  timestamptz not null default now()
);
create table if not exists public.reset_attempts (
  id        bigint generated always as identity primary key,
  staff_id  text not null,
  ok        boolean not null,
  at        timestamptz not null default now()
);
create index if not exists reset_attempts_staff on public.reset_attempts (staff_id, at);
alter table public.recovery_codes enable row level security;
alter table public.reset_attempts enable row level security;
revoke all on public.recovery_codes, public.reset_attempts from anon, authenticated;

create or replace function public._code_hash(p_code text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
$$;

create or replace function public._new_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(12);
  s text := '';
  i int;
begin
  for i in 0..11 loop
    s := s || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    if i in (3, 7) then s := s || '-'; end if;
  end loop;
  return s;
end $$;

create or replace function public._set_code(p_user uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text := public._new_code();
begin
  insert into public.recovery_codes (user_id, code_hash) values (p_user, public._code_hash(c))
  on conflict (user_id) do update set code_hash = excluded.code_hash, created_at = now();
  return c;
end $$;

-- App: make (or replace) my recovery code. The plain code is shown once and never stored.
create or replace function public.new_recovery_code() returns text
language sql security definer set search_path = public as $$
  select public._set_code(public._uid());
$$;

create or replace function public.has_recovery_code() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recovery_codes where user_id = public._uid());
$$;

-- Reset function only (service role): check a staff ID + code. Returns the user id or null.
create or replace function public.recovery_check(p_staff text, p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s     text := upper(regexp_replace(coalesce(p_staff, ''), '\s', '', 'g'));
  uid   uuid;
  found_ok boolean := false;
begin
  if s ~ '^[A-Z]{2}[0-9]+$' then s := substr(s, 1, 2) || '-' || substr(s, 3); end if;
  if (select count(*) from public.reset_attempts a where a.staff_id = s and not a.ok and a.at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many attempts';
  end if;
  select p.id into uid from public.profiles p join public.recovery_codes r on r.user_id = p.id
   where p.staff_id = s and r.code_hash = public._code_hash(p_code);
  found_ok := uid is not null;
  insert into public.reset_attempts (staff_id, ok) values (s, found_ok);
  return uid;
end $$;

create or replace function public.recovery_rotate(p_user uuid) returns text
language sql security definer set search_path = public as $$
  select public._set_code(p_user);
$$;

-- ---------- peer recognition ----------
create table if not exists public.kudos (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles(id) on delete cascade,
  to_user     uuid not null references public.profiles(id) on delete cascade,
  badge       text not null check (badge in ('Team Player','Positive Energy','Customer Hero','Problem Solver','Mentor','Innovation')),
  message     text not null default '' check (char_length(message) <= 140),
  created_at  timestamptz not null default now(),
  check (from_user <> to_user)
);
create index if not exists kudos_to on public.kudos (to_user, created_at desc);
create index if not exists kudos_from on public.kudos (from_user, created_at desc);
alter table public.kudos enable row level security;
drop policy if exists own_kudos on public.kudos;
create policy own_kudos on public.kudos for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());
revoke all on public.kudos from anon;
grant select on public.kudos to authenticated;

create or replace function public.search_colleagues(p_q text)
returns table (id uuid, name text, department text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.department from public.profiles p
   where p.id <> public._uid()
     and length(trim(coalesce(p_q, ''))) >= 2
     and (p.full_name ilike '%' || trim(p_q) || '%' or p.staff_id ilike trim(p_q) || '%')
   order by p.full_name
   limit 8;
$$;

create or replace function public.send_kudos(p_to uuid, p_badge text, p_message text) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := public._uid();
  d     date := public.my_today();
  me    text;
  kid   uuid;
  msg   text := left(trim(coalesce(p_message, '')), 140);
  n     int;
  pts   int := 0;
begin
  if p_to = uid then raise exception 'You can''t send a thank-you to yourself.'; end if;
  if p_badge not in ('Team Player','Positive Energy','Customer Hero','Problem Solver','Mentor','Innovation') then
    raise exception 'Choose a badge.';
  end if;
  if not exists (select 1 from public.profiles where id = p_to) then raise exception 'Colleague not found.'; end if;
  if (select count(*) from public.kudos where from_user = uid
        and (created_at at time zone 'Asia/Kuala_Lumpur')::date = d) >= 5 then
    raise exception 'You can send up to 5 thank-yous a day.';
  end if;
  select full_name into me from public.profiles where id = uid;
  insert into public.kudos (from_user, to_user, badge, message) values (uid, p_to, p_badge, msg) returning id into kid;
  -- 30 points for the person recognised
  insert into public.ledger (user_id, day, kind, award_key, title, sub, points)
  values (p_to, d, 'kudos', 'kudos:' || kid, 'Recognised by ' || me, p_badge, 30);
  insert into public.badges (user_id, badge) values (p_to, p_badge) on conflict do nothing;
  -- 10 points for the sender, once a day
  insert into public.ledger (user_id, day, kind, award_key, title, points)
  values (uid, d, 'kudos', 'kudos-sent:' || d, 'Sent a thank-you', 10)
  on conflict (user_id, award_key) do nothing;
  get diagnostics n = row_count;
  if n > 0 then pts := 10; end if;
  perform public.notify(p_to, 'kudos',
    public.tr(p_to, me || ' recognised you: ' || p_badge, me || ' menghargai anda: ' || public.badge_ms(p_badge)),
    coalesce(nullif(msg, ''), public.tr(p_to, 'You earned 30 points and a new badge.', 'Anda dapat 30 mata dan lencana baharu.')),
    '#kudos', 'kudos:' || kid);
  return json_build_object('id', kid, 'sender_points', pts);
end $$;

-- scope: 'received' | 'sent' | 'wall' (latest from everyone, last 30 days)
create or replace function public.kudos_feed(p_scope text)
returns table (id uuid, from_name text, to_name text, badge text, message text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select k.id, f.full_name, t.full_name, k.badge, k.message, k.created_at
    from public.kudos k
    join public.profiles f on f.id = k.from_user
    join public.profiles t on t.id = k.to_user
   where case p_scope
           when 'received' then k.to_user = public._uid()
           when 'sent'     then k.from_user = public._uid()
           else k.created_at > now() - interval '30 days' end
   order by k.created_at desc
   limit 30;
$$;

-- ---------- ask a leader for a catch-up ----------
create table if not exists public.catchup_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.catchup_requests enable row level security;
revoke all on public.catchup_requests from anon, authenticated;

-- Tells the leaders in the same department that this person would like a chat.
-- Shares nothing else: no stress scores, moods or notes.
create or replace function public.request_catchup() returns int
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := public._uid();
  me   public.profiles;
  n    int;
begin
  if exists (select 1 from public.catchup_requests where user_id = uid and created_at > now() - interval '3 days') then
    raise exception 'You asked for a catch-up recently. Your leader has already been told.';
  end if;
  select * into me from public.profiles where id = uid;
  insert into public.catchup_requests (user_id) values (uid);
  perform public.notify(l.id, 'catchup',
    public.tr(l.id, me.full_name || ' would like a quick catch-up', me.full_name || ' ingin berbual sebentar'),
    public.tr(l.id, 'They asked for a 15-minute chat this week. Reach out when you can.',
                    'Mereka meminta perbualan 15 minit minggu ini. Hubungi mereka apabila sesuai.'),
    '#team', 'catchup:' || uid || ':' || public.my_today())
    from public.profiles l
   where l.role = 'leader' and l.department = me.department and l.id <> uid;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- permissions ----------
do $$
declare f text;
begin
  foreach f in array array[
    'public.set_language(text)', 'public.give_consent(text)', 'public.delete_my_account()',
    'public.new_recovery_code()', 'public.has_recovery_code()', 'public.search_colleagues(text)',
    'public.send_kudos(uuid, text, text)', 'public.kudos_feed(text)', 'public.request_catchup()',
    'public.host_session(text, text)', 'public.award_session(uuid, int)', 'public.send_test_notification()']
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array[
    'public._code_hash(text)', 'public._new_code()', 'public._set_code(uuid)', 'public.tr(uuid, text, text)',
    'public.lang_of(uuid)', 'public.job_checkin_reminders()', 'public.job_weekly_recap()',
    'public.job_coupon_expiry()', 'public.job_sessions()']
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
  foreach f in array array['public.recovery_check(text, text)', 'public.recovery_rotate(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
