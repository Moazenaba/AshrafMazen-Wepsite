-- Two admins saving the same shared record (the books, the lesson extras) at the same moment must not erase each other.
-- The site reads the record, applies its change, and calls this function, which writes only if the stored value is still
-- the one that was read. When it answers false, the site reads the newer copy and applies the change again.
-- Safe to run again. Until it is run, the site saves the old way (last save wins).

create or replace function public.save_setting_if_unchanged(p_key text, p_previous text, p_next text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed integer;
begin
  if not public.is_admin() then
    raise exception 'admins only';
  end if;

  if p_previous is null then
    -- the record does not exist yet: create it, unless someone created it first
    insert into public.site_settings (key, value) values (p_key, p_next) on conflict (key) do nothing;
  else
    update public.site_settings set value = p_next where key = p_key and value = p_previous;
  end if;

  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on function public.save_setting_if_unchanged(text, text, text) from public;
grant execute on function public.save_setting_if_unchanged(text, text, text) to authenticated;
