-- =====================================================================
-- SMISKEE: Customize Home (run after 003). Safe to run again.
-- Saves each person's Home card order and which cards are switched off,
-- so their layout follows them to every device.
-- =====================================================================

alter table public.profiles add column if not exists home_layout jsonb;

create or replace function public.set_home_layout(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p is not null and (jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 20
     or exists (select 1 from jsonb_array_elements(p) e
                 where jsonb_typeof(e) <> 'object' or jsonb_typeof(e->'id') <> 'string'
                    or jsonb_typeof(e->'on') <> 'boolean' or length(e->>'id') > 30)) then
    raise exception 'Invalid layout.';
  end if;
  update public.profiles set home_layout = p where id = public._uid();
end $$;

revoke all on function public.set_home_layout(jsonb) from public, anon;
grant execute on function public.set_home_layout(jsonb) to authenticated;
