-- =====================================================================
-- SMISKEE database schema for Supabase
-- Run this whole file once in Supabase: SQL Editor > New query > Run.
-- It is safe to run again: it drops and recreates SMISKEE's own objects
-- only if you uncomment the reset block below.
--
-- Security model
--   * Every table has Row Level Security. People can only read their own rows.
--   * Nobody writes points directly. All writes go through the functions at
--     the bottom (submit_checkin, award_game, spin_wheel, redeem_reward ...),
--     which run on the server and apply the points rules.
--   * Leaders only ever see anonymous team averages (team_pulse), and only
--     when 5 or more people in their department have checked in this week.
-- =====================================================================

-- ---------- optional reset (uncomment to wipe SMISKEE data) ----------
-- drop table if exists public.session_reminders, public.sessions, public.intentions,
--   public.badges, public.coupons, public.rewards, public.plays, public.ledger,
--   public.checkins, public.profiles cascade;

-- ---------- helpers ----------
create or replace function public.my_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kuala_Lumpur')::date $$;

create or replace function public.week_start(d date) returns date
language sql immutable as $$ select d - (extract(isodow from d)::int - 1) $$;

-- ---------- tables ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 80),
  staff_id    text not null unique check (staff_id ~ '^[A-Z]{2}-[0-9]{3,6}$'),
  department  text not null check (department in
                ('Retail Banking','Digital Banking','Operations','Credit & Risk','Treasury','Compliance')),
  role        text not null default 'employee' check (role in ('employee','leader')),
  created_at  timestamptz not null default now()
);

create table if not exists public.checkins (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  day         date not null,
  stress      smallint not null check (stress between 1 and 10),
  mood        text check (mood in ('great','good','okay','tense','drained')),
  tags        text[] not null default '{}',
  note        text check (char_length(note) <= 500),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

-- Points ledger: balance = sum(points). award_key makes an award happen once.
create table if not exists public.ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  day         date not null default public.my_today(),
  kind        text not null,
  award_key   text,
  title       text not null,
  sub         text not null default '',
  points      integer not null,
  created_at  timestamptz not null default now(),
  unique (user_id, award_key)
);
create index if not exists ledger_user_day on public.ledger (user_id, day);

create table if not exists public.plays (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  day         date not null default public.my_today(),
  game        text not null,
  points      integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists plays_user_day on public.plays (user_id, day);

create table if not exists public.rewards (
  id          text primary key,
  brand       text not null,
  category    text not null,
  value_rm    integer,
  points      integer not null check (points > 0),
  color       text not null default '#315c4c',
  perk        text,
  active      boolean not null default true,
  sort        integer not null default 0
);

create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reward_id   text not null references public.rewards(id),
  brand       text not null,
  label       text not null,
  code        text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days'
);

create table if not exists public.badges (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge       text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, badge)
);

create table if not exists public.intentions (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  week_start  date not null,
  idx         smallint not null check (idx between 0 and 2),
  primary key (user_id, week_start, idx)
);

create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  when_label  text not null check (char_length(when_label) <= 40),
  live        boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.session_reminders (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  primary key (user_id, session_id)
);

-- ---------- reward catalogue ----------
insert into public.rewards (id, brand, category, value_rm, points, color, perk, sort) values
  ('zus',       'ZUS Coffee',              'Coffee',   15,  900, '#1d3f8c', null,    1),
  ('arabica',   '% Arabica',               'Coffee',   20, 1200, '#3a3a3a', null,    2),
  ('larasuka',  'Larasuka Coffee',         'Coffee',   15,  850, '#7b4a2b', null,    3),
  ('rembayung', 'Rembayung',               'Food',     20, 1300, '#8a3b2a', null,    4),
  ('sukiya',    'Sukiya',                  'Food',     20, 1400, '#b8312f', null,    5),
  ('bbqtown',   'BBQ Town',                'Food',     20, 1500, '#a3501b', null,    6),
  ('kyochon',   'Kyochon',                 'Food',     20, 1550, '#5b3a1e', null,    7),
  ('lunch',     'Extended lunch (1 hour)', 'Time off', null, 2000, '#315c4c', '1 HR',  8),
  ('halfday',   'Half-day leave',          'Time off', null, 5000, '#183b32', '½ DAY', 9)
on conflict (id) do update set brand = excluded.brand, category = excluded.category,
  value_rm = excluded.value_rm, points = excluded.points, color = excluded.color,
  perk = excluded.perk, sort = excluded.sort;

-- ---------- create a profile whenever someone signs up ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, staff_id, department, role)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data->>'full_name', '')),
    upper(trim(coalesce(new.raw_user_meta_data->>'staff_id', ''))),
    coalesce(new.raw_user_meta_data->>'department', 'Digital Banking'),
    case when new.raw_user_meta_data->>'role' = 'leader' then 'leader' else 'employee' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row level security ----------
alter table public.profiles          enable row level security;
alter table public.checkins          enable row level security;
alter table public.ledger            enable row level security;
alter table public.plays             enable row level security;
alter table public.rewards           enable row level security;
alter table public.coupons           enable row level security;
alter table public.badges            enable row level security;
alter table public.intentions        enable row level security;
alter table public.sessions          enable row level security;
alter table public.session_reminders enable row level security;

drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists own_checkins on public.checkins;
create policy own_checkins on public.checkins for select to authenticated using (user_id = auth.uid());
drop policy if exists own_ledger on public.ledger;
create policy own_ledger on public.ledger for select to authenticated using (user_id = auth.uid());
drop policy if exists own_plays on public.plays;
create policy own_plays on public.plays for select to authenticated using (user_id = auth.uid());
drop policy if exists read_rewards on public.rewards;
create policy read_rewards on public.rewards for select to authenticated using (active);
drop policy if exists own_coupons on public.coupons;
create policy own_coupons on public.coupons for select to authenticated using (user_id = auth.uid());
drop policy if exists own_badges on public.badges;
create policy own_badges on public.badges for select to authenticated using (user_id = auth.uid());
drop policy if exists own_intentions on public.intentions;
create policy own_intentions on public.intentions for select to authenticated using (user_id = auth.uid());
-- sessions are read through list_sessions(), which hides other people's IDs
drop policy if exists own_reminders_read on public.session_reminders;
create policy own_reminders_read on public.session_reminders for select to authenticated using (user_id = auth.uid());
drop policy if exists own_reminders_add on public.session_reminders;
create policy own_reminders_add on public.session_reminders for insert to authenticated with check (user_id = auth.uid());
drop policy if exists own_reminders_del on public.session_reminders;
create policy own_reminders_del on public.session_reminders for delete to authenticated using (user_id = auth.uid());

revoke all on public.profiles, public.checkins, public.ledger, public.plays, public.rewards,
  public.coupons, public.badges, public.intentions, public.sessions, public.session_reminders from anon;
grant select on public.profiles, public.checkins, public.ledger, public.plays, public.rewards,
  public.coupons, public.badges, public.intentions, public.session_reminders to authenticated;
grant insert, delete on public.session_reminders to authenticated;

-- =====================================================================
-- Server-side actions. The app calls these with supabase.rpc(...)
-- =====================================================================

create or replace function public._uid() returns uuid
language plpgsql stable as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Please sign in again.' using errcode = '28000'; end if;
  return u;
end $$;

-- Points balance (all time) and lifetime points earned
create or replace function public.my_points() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'balance',  coalesce(sum(points), 0),
    'lifetime', coalesce(sum(points) filter (where points > 0), 0))
  from public.ledger where user_id = public._uid();
$$;

-- Daily stress check-in. 20 points the first time each day.
create or replace function public.submit_checkin(p_stress int, p_mood text, p_tags text[], p_note text)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._uid();
  d   date := public.my_today();
  n   int;
begin
  if p_stress is null or p_stress not between 1 and 10 then raise exception 'Stress must be between 1 and 10.'; end if;
  if not coalesce(p_tags, '{}') <@ array['Sales targets','Customer queue','Compliance & audit',
       'System issues','Workload','Month-end closing','Personal'] then
    raise exception 'Unknown tag.';
  end if;
  insert into public.checkins (user_id, day, stress, mood, tags, note)
  values (uid, d, p_stress, nullif(p_mood, ''), coalesce(p_tags, '{}'), nullif(trim(coalesce(p_note, '')), ''))
  on conflict (user_id, day) do update
    set stress = excluded.stress, mood = excluded.mood, tags = excluded.tags,
        note = excluded.note, updated_at = now();
  insert into public.ledger (user_id, day, kind, award_key, title, sub, points)
  values (uid, d, 'checkin', 'checkin:' || d, 'Daily check-in', 'Stress ' || p_stress || '/10', 20)
  on conflict (user_id, award_key) do nothing;
  get diagnostics n = row_count;
  return case when n > 0 then 20 else 0 end;
end $$;

-- Solo games. Points are calculated here, once per game per day.
create or replace function public.award_game(p_game text, p_score int)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := public._uid();
  d     date := public.my_today();
  s     int  := greatest(coalesce(p_score, 0), 0);
  pts   int;
  title text;
  n     int;
begin
  pts := case p_game
    when 'quiz'   then least(s, 5) * 30
    when 'memory' then case when s < 6 then 0 when s <= 10 then 100 when s <= 14 then 70 else 40 end
    when 'breath' then 80
    when 'brain'  then least(s, 5) * 10
  end;
  title := case p_game
    when 'quiz' then 'Banking Knowledge Quiz' when 'memory' then 'Memory Match'
    when 'breath' then 'Focus breathing' when 'brain' then 'Quick Brain Break' end;
  if pts is null then raise exception 'Unknown game.'; end if;
  if pts > 0 then
    insert into public.ledger (user_id, day, kind, award_key, title, points)
    values (uid, d, 'game', 'game:' || p_game || ':' || d, title, pts)
    on conflict (user_id, award_key) do nothing;
    get diagnostics n = row_count;
    if n = 0 then pts := 0; end if;
  end if;
  insert into public.plays (user_id, day, game, points) values (uid, d, p_game, pts);
  return pts;
end $$;

-- Daily wheel. The server picks the prize; the app just animates to it.
create or replace function public.spin_wheel() returns json
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := public._uid();
  d    date := public.my_today();
  segs int[] := array[20, 50, 30, 100, 40, 150, 60, 80];
  i    int;
  prev int;
begin
  select points into prev from public.ledger where user_id = uid and award_key = 'spin:' || d;
  if found then
    return json_build_object('index', array_position(segs, prev) - 1, 'points', prev, 'already', true);
  end if;
  i := floor(random() * 8)::int;
  insert into public.ledger (user_id, day, kind, award_key, title, points)
  values (uid, d, 'game', 'spin:' || d, 'Spin & Win', segs[i + 1]);
  insert into public.plays (user_id, day, game, points) values (uid, d, 'spin', segs[i + 1]);
  return json_build_object('index', i, 'points', segs[i + 1], 'already', false);
end $$;

-- Leader-hosted rounds: double quiz points once per session, plus a badge.
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
   where s.id = p_session and s.live and s.created_at > now() - interval '3 hours';
  if not found then raise exception 'This session has ended.'; end if;
  if pts > 0 then
    insert into public.ledger (user_id, day, kind, award_key, title, points)
    values (uid, d, 'session', 'session:' || p_session, 'Leader round with ' || host, pts)
    on conflict (user_id, award_key) do nothing;
    get diagnostics n = row_count;
    if n = 0 then pts := 0; end if;
  end if;
  insert into public.plays (user_id, day, game, points) values (uid, d, 'session', pts);
  insert into public.badges (user_id, badge) values (uid, 'Leader Round') on conflict do nothing;
  return pts;
end $$;

-- Redeem a reward. Checks the balance and creates a coupon code.
create or replace function public.redeem_reward(p_reward text) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := public._uid();
  r    public.rewards;
  bal  int;
  u    text;
  c    public.coupons;
  lbl  text;
begin
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into r from public.rewards where id = p_reward and active;
  if not found then raise exception 'This reward is no longer available.'; end if;
  select coalesce(sum(points), 0) into bal from public.ledger where user_id = uid;
  if bal < r.points then raise exception 'You need % more points for this reward.', r.points - bal; end if;
  lbl := case when r.value_rm is not null then 'RM' || r.value_rm || ' voucher' else 'Company perk' end;
  u := upper(replace(gen_random_uuid()::text, '-', ''));
  insert into public.coupons (user_id, reward_id, brand, label, code)
  values (uid, r.id, r.brand, lbl, 'SMK-' || substr(u, 1, 4) || '-' || substr(u, 5, 4))
  returning * into c;
  insert into public.ledger (user_id, kind, title, sub, points)
  values (uid, 'redeem', 'Reward redeemed', r.brand || coalesce(' RM' || r.value_rm || ' voucher', ''), -r.points);
  return json_build_object('code', c.code, 'brand', c.brand, 'label', c.label, 'expires_at', c.expires_at);
end $$;

-- Weekly intentions on the recap screen. 10 points the first time each is ticked.
create or replace function public.toggle_intention(p_week date, p_idx int) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._uid();
  n   int;
begin
  if p_week <> public.week_start(p_week)
     or p_week not between public.week_start(public.my_today()) - 7 and public.week_start(public.my_today()) + 7 then
    raise exception 'You can only plan for this week or next week.';
  end if;
  delete from public.intentions where user_id = uid and week_start = p_week and idx = p_idx;
  get diagnostics n = row_count;
  if n > 0 then return json_build_object('on', false, 'points', 0); end if;
  insert into public.intentions (user_id, week_start, idx) values (uid, p_week, p_idx);
  insert into public.ledger (user_id, kind, award_key, title, points)
  values (uid, 'intention', 'intent:' || p_week || ':' || p_idx, 'Weekly intention set', 10)
  on conflict (user_id, award_key) do nothing;
  get diagnostics n = row_count;
  return json_build_object('on', true, 'points', case when n > 0 then 10 else 0 end);
end $$;

-- Leader sessions
create or replace function public.list_sessions()
returns table (id uuid, name text, when_label text, live boolean, host_name text,
               host_title text, is_mine boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.when_label,
         s.live and s.created_at > now() - interval '3 hours',
         p.full_name, 'Team leader · ' || p.department, s.host_id = public._uid(), s.created_at
    from public.sessions s join public.profiles p on p.id = s.host_id
   where s.created_at > now() - interval '7 days'
   order by (s.live and s.created_at > now() - interval '3 hours') desc, s.created_at desc
   limit 20;
$$;

create or replace function public.host_session(p_name text, p_when text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._uid();
  sid uuid;
begin
  if not exists (select 1 from public.profiles where id = uid and role = 'leader') then
    raise exception 'Only team leaders can host sessions.';
  end if;
  insert into public.sessions (host_id, name, when_label, live)
  values (uid, coalesce(nullif(trim(p_name), ''), 'Team Trivia'), p_when, p_when = 'Live now')
  returning id into sid;
  return sid;
end $$;

create or replace function public.end_session(p_session uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.sessions where id = p_session and host_id = public._uid();
$$;

-- Department leaderboard: points earned this week, by department
create or replace function public.department_leaderboard()
returns table (department text, points bigint)
language sql stable security definer set search_path = public as $$
  with depts(department) as (values ('Retail Banking'),('Digital Banking'),('Operations'),
                                   ('Credit & Risk'),('Treasury'),('Compliance'))
  select d.department, coalesce(sum(l.points), 0)::bigint
    from depts d
    left join public.profiles p on p.department = d.department
    left join public.ledger l on l.user_id = p.id and l.points > 0
          and l.day >= public.week_start(public.my_today())
   group by d.department
   order by 2 desc, 1;
$$;

-- Team pulse for leaders: anonymous, and only with 5+ people checked in
create or replace function public.team_pulse() returns json
language plpgsql stable security definer set search_path = public as $$
declare
  uid   uuid := public._uid();
  dept  text;
  wk    date := public.week_start(public.my_today());
  members int; checked int;
  result json;
begin
  select department into dept from public.profiles where id = uid and role = 'leader';
  if not found then raise exception 'Only team leaders can see the team pulse.'; end if;
  select count(*) into members from public.profiles where department = dept;
  select count(distinct c.user_id) into checked
    from public.checkins c join public.profiles p on p.id = c.user_id
   where p.department = dept and c.day >= wk;
  if checked < 5 then
    return json_build_object('enough', false, 'department', dept, 'members', members, 'checked', checked);
  end if;
  with team as (select id from public.profiles where department = dept),
  this_week as (select c.* from public.checkins c join team t on t.id = c.user_id where c.day >= wk),
  latest as (select distinct on (user_id) user_id, stress from this_week order by user_id, day desc),
  tags as (select tag, count(distinct user_id) people from this_week, unnest(tags) tag
            group by tag order by 2 desc limit 4),
  weeks as (select g::date w from generate_series(wk - 21, wk, interval '7 days') g)
  select json_build_object(
    'enough', true, 'department', dept, 'members', members, 'checked', checked,
    'avg',      (select round(avg(stress)::numeric, 1) from this_week),
    'prev_avg', (select round(avg(c.stress)::numeric, 1) from public.checkins c join team t on t.id = c.user_id
                  where c.day >= wk - 7 and c.day < wk),
    'calm',  (select count(*) from latest where stress <= 4),
    'press', (select count(*) from latest where stress between 5 and 6),
    'high',  (select count(*) from latest where stress >= 7),
    'tags',  coalesce((select json_agg(json_build_object('tag', tag, 'people', people)) from tags), '[]'::json),
    'trend', (select json_agg(json_build_object('week', w, 'avg',
                (select round(avg(c.stress)::numeric, 1) from public.checkins c join team t on t.id = c.user_id
                  where c.day >= w and c.day < w + 7)) order by w) from weeks)
  ) into result;
  return result;
end $$;

-- Only signed-in users may call the actions
do $$
declare f text;
begin
  foreach f in array array[
    'public.my_points()', 'public.submit_checkin(int, text, text[], text)', 'public.award_game(text, int)',
    'public.spin_wheel()', 'public.award_session(uuid, int)', 'public.redeem_reward(text)',
    'public.toggle_intention(date, int)', 'public.list_sessions()', 'public.host_session(text, text)',
    'public.end_session(uuid)', 'public.department_leaderboard()', 'public.team_pulse()']
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
