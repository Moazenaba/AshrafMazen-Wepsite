-- Security pass (see docs/audit/03-logic-review.md, items 6, 35 and 41). Safe to run again.
--
-- BEFORE running this file: put SUPABASE_SERVICE_ROLE_KEY in Vercel (and in .env.local) and deploy, so that
-- api/submit writes visitor requests with the server's key. After this file, the public key can no longer add
-- requests directly, so without that key the "شارك" form stops working.
--
--   1. The core tables (categories, series, lessons, site_settings, social_links, admins) get one written-down set
--      of permissions. Until now they were created by hand and had no file, so nobody could tell what was allowed.
--      Every existing policy on these six tables is replaced by the set below.
--   2. Draft books are hidden: the library record is readable by admins only, and visitors read the published
--      books through published_books().
--   3. Visitor requests can be added only through api/submit (which checks them, rate-limits them and stops bots).
--      The database checks them again, and keeps the cap of 500 waiting requests.

-- ---------------------------------------------------------------- who is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------- 1. the core tables
-- Start from a clean slate on these six tables, then write the full set
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('categories', 'series', 'lessons', 'site_settings', 'social_links', 'admins')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table public.categories enable row level security;
alter table public.series enable row level security;
alter table public.lessons enable row level security;
alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.admins enable row level security;

-- Visitors only read; signed-in users may write, but the policies below let only admins do it
revoke insert, update, delete on table public.categories, public.series, public.lessons, public.site_settings, public.social_links, public.admins from anon;
grant select on table public.categories, public.series, public.lessons, public.site_settings, public.social_links to anon, authenticated;
grant insert, update, delete on table public.categories, public.series, public.lessons, public.site_settings, public.social_links to authenticated;
revoke all on table public.admins from anon;
grant select on table public.admins to authenticated;

-- Categories and series: everyone reads, admins write
create policy "anyone reads categories" on public.categories for select using (true);
create policy "admins write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "anyone reads series" on public.series for select using (true);
create policy "admins write series" on public.series for all using (public.is_admin()) with check (public.is_admin());

-- Lessons: visitors see published lessons only; drafts are for admins
create policy "anyone reads published lessons" on public.lessons for select using (status = 'published' or public.is_admin());
create policy "admins write lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

-- Social links: visitors see the active ones
create policy "anyone reads active social links" on public.social_links for select using (is_active or public.is_admin());
create policy "admins write social links" on public.social_links for all using (public.is_admin()) with check (public.is_admin());

-- Site settings: everything is public except the library record, which holds draft books and their file links
create policy "anyone reads public settings" on public.site_settings for select using (key <> 'library_books' or public.is_admin());
create policy "admins write settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- Admins: a signed-in user can see only whether they themselves are an admin (the sign-in check and api/r2 need this).
-- Nobody adds or removes admins from the site; that is done here, in the SQL editor.
create policy "users read their own admin row" on public.admins for select using (user_id = auth.uid());

-- ---------------------------------------------------------------- 2. published books for visitors
create or replace function public.published_books()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  library jsonb;
begin
  begin
    select value::jsonb into library from public.site_settings where key = 'library_books';
  exception when others then
    return '[]'::jsonb;
  end;
  if library is null or jsonb_typeof(library) <> 'array' then
    return '[]'::jsonb;
  end if;
  return coalesce(
    (select jsonb_agg(book) from jsonb_array_elements(library) book where book->>'status' = 'published'),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.published_books() from public;
grant execute on function public.published_books() to anon, authenticated;

-- ---------------------------------------------------------------- 3. visitor requests
-- No direct writes with the public key: requests come through api/submit, which uses the server's key
drop policy if exists "visitors submit pending" on public.submissions;
revoke insert on table public.submissions from anon;

-- The same rules as api/submit, checked again here, plus the cap on waiting requests
create or replace function public.check_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'pending' or new.admin_note <> '' or new.reviewed_at is not null then
    raise exception 'a new request must be pending';
  end if;
  if new.kind in ('book', 'audio', 'video') and new.url = '' then
    raise exception 'a link is required';
  end if;
  if new.url <> '' and new.url !~* '^https?://' then
    raise exception 'links must start with http:// or https://';
  end if;
  if new.kind in ('correction', 'removal') and char_length(new.details) < 5 then
    raise exception 'details are required';
  end if;
  if (select count(*) from public.submissions where status = 'pending') >= 500 then
    raise exception 'too many pending requests';
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_check on public.submissions;
create trigger submissions_check before insert on public.submissions
  for each row execute function public.check_submission();
