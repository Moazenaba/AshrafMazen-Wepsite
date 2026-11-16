-- 2026-11-16: the undo copies <key>__prev (WP-15) are readable by admins only, like the library record itself.
-- Safe to run twice. Before this file, any visitor could read library_books__prev through the database API.
drop policy if exists "anyone reads public settings" on public.site_settings;
create policy "anyone reads public settings" on public.site_settings
  for select using ((key <> 'library_books' and key not like '%\_\_prev') or public.is_admin());
