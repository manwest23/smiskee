-- SMISKEE: Bahasa Indonesia (run after 004). Safe to run again.
--   * profiles.lang now accepts 'id'
--   * notifications are written in Indonesian for people who chose it
--
-- Notification text is written in English and Malay by the existing functions.
-- For Indonesian, tr() converts the English sentence with en_to_id() below, so
-- none of the notification functions need to change.

alter table public.profiles drop constraint if exists profiles_lang_check;
alter table public.profiles add constraint profiles_lang_check check (lang in ('en','ms','id'));

create or replace function public.set_language(p_lang text) returns void
language sql security definer set search_path = public as $$
  update public.profiles set lang = case when p_lang in ('ms','id') then p_lang else 'en' end where id = public._uid();
$$;

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
    case when m->>'lang' in ('ms','id') then m->>'lang' else 'en' end,
    case when m->>'consent_version' is not null then now() end,
    m->>'consent_version'
  );
  return new;
end $$;

create or replace function public.badge_id(p_badge text) returns text
language sql immutable as $$
  select case p_badge
    when 'Team Player' then 'Pemain Tim' when 'Positive Energy' then 'Energi Positif'
    when 'Customer Hero' then 'Pahlawan Nasabah' when 'Problem Solver' then 'Pemecah Masalah'
    when 'Mentor' then 'Mentor' when 'Innovation' then 'Inovasi'
    when 'Leader Round' then 'Ronde Pemimpin' else p_badge end;
$$;

create or replace function public.en_to_id(p text) returns text
language plpgsql immutable as $$
declare m text[];
begin
  case p
    when 'Time for your daily check-in' then return 'Waktunya check-in harian Anda';
    when 'How are you feeling today? It takes 20 seconds and earns 20 points.'
      then return 'Bagaimana perasaan Anda hari ini? Hanya 20 detik dan Anda mendapat 20 poin.';
    when 'Your weekly recap is ready' then return 'Rekap mingguan Anda sudah siap';
    when 'See how your week went and pick your intentions for next week.'
      then return 'Lihat bagaimana minggu Anda berjalan dan pilih niat untuk minggu depan.';
    when 'New badge: Leader Round' then return 'Lencana baru: Ronde Pemimpin';
    when 'Thanks for joining a leader session. See it on your profile.'
      then return 'Terima kasih telah mengikuti sesi pemimpin. Lihat lencananya di profil Anda.';
    when 'Notifications are on' then return 'Notifikasi aktif';
    when 'This is how SMISKEE reminders will look on this device.'
      then return 'Seperti inilah tampilan pengingat SMISKEE di perangkat ini.';
    when 'You earned 30 points and a new badge.' then return 'Anda mendapat 30 poin dan lencana baru.';
    when 'They asked for a 15-minute chat this week. Reach out when you can.'
      then return 'Mereka meminta obrolan 15 menit minggu ini. Hubungi mereka saat Anda sempat.';
    else null;
  end case;

  m := regexp_match(p, '^(.*) is hosting a live round$');
  if m is not null then return m[1] || ' sedang mengadakan ronde langsung'; end if;
  m := regexp_match(p, '^Join "(.*)" now for double points\.$');
  if m is not null then return 'Ikuti "' || m[1] || '" sekarang untuk poin ganda.'; end if;
  m := regexp_match(p, '^"(.*)" starts soon$');
  if m is not null then return '"' || m[1] || '" segera dimulai'; end if;
  m := regexp_match(p, '^(.*)''s round starts at (.*)\. Get ready to join\.$');
  if m is not null then return 'Ronde ' || m[1] || ' dimulai pukul ' || m[2] || '. Bersiaplah untuk bergabung.'; end if;
  m := regexp_match(p, '^(.*) voucher expires soon$');
  if m is not null then return 'Voucher ' || m[1] || ' segera kedaluwarsa'; end if;
  m := regexp_match(p, '^Your code (.*) expires on (.*)\. Use it before then\.$');
  if m is not null then
    return 'Kode ' || m[1] || ' kedaluwarsa pada ' ||
      replace(replace(replace(replace(m[2], 'May', 'Mei'), 'Aug', 'Agu'), 'Oct', 'Okt'), 'Dec', 'Des') ||
      '. Gunakan sebelum tanggal itu.';
  end if;
  m := regexp_match(p, '^(.*) recognised you: (.*)$');
  if m is not null then return m[1] || ' mengapresiasi Anda: ' || public.badge_id(m[2]); end if;
  m := regexp_match(p, '^(.*) would like a quick catch-up$');
  if m is not null then return m[1] || ' ingin mengobrol sebentar'; end if;
  return p;
end $$;

create or replace function public.tr(p_user uuid, p_en text, p_ms text) returns text
language sql stable security definer set search_path = public as $$
  select case (select lang from public.profiles where id = p_user)
    when 'ms' then p_ms when 'id' then public.en_to_id(p_en) else p_en end;
$$;

revoke all on function public.badge_id(text), public.en_to_id(text) from public, anon;
grant execute on function public.set_language(text) to authenticated;
select 'indonesian ready' as status;
