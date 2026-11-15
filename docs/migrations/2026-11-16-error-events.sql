-- 2026-11-16: the site's own error log (WP-05) and a daily cap on the open analytics function (SEC-08).
-- Safe to run twice. Run it in the Supabase SQL editor, then reload the admin's "البيانات والتكامل" tab.

create table if not exists public.error_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  source text not null check (source in ('function', 'browser', 'csp', 'monitor')),
  name text not null,
  message text not null default '',
  detail jsonb not null default '{}'::jsonb,
  path text not null default ''
);
create index if not exists error_events_at on public.error_events (at desc);
alter table public.error_events enable row level security;
revoke all on table public.error_events from anon, authenticated;
grant select, delete on table public.error_events to authenticated;
drop policy if exists "admins read errors" on public.error_events;
create policy "admins read errors" on public.error_events for select using (public.is_admin());
drop policy if exists "admins clear errors" on public.error_events;
create policy "admins clear errors" on public.error_events for delete using (public.is_admin());
-- Rows are written only with the server's key (the service role bypasses row level security).

-- record_event as in 2026-11-04-analytics.sql, plus the daily cap
create or replace function public.record_event(p_kind text, p_key text, p_seconds integer default 0, p_view boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  secs integer := greatest(0, least(coalesce(p_seconds, 0), 600));
  col text;
begin
  if p_kind not in ('video', 'audio', 'read', 'page') then
    raise exception 'invalid kind';
  end if;

  if p_kind = 'page' then
    insert into public.daily_stats (day, metric, value) values (current_date, 'pageviews', 1)
    on conflict (day, metric) do update set value = daily_stats.value + 1;
    return;
  end if;

  if p_key is null or p_key !~ '^(lesson|yt|book):[A-Za-z0-9_-]{3,70}$' then
    raise exception 'invalid key';
  end if;

  -- Daily cap: once 20 hours x 1000 viewers of this kind were recorded today, further reports are ignored
  if secs > 0 and coalesce((select value from public.daily_stats where day = current_date and metric = 'seconds_' || p_kind), 0) > 72000000 then
    return;
  end if;

  col := p_kind || '_seconds';
  execute format(
    'insert into public.content_stats as c (key, views, %1$I) values ($1, $2, $3)
       on conflict (key) do update set views = c.views + $2, %1$I = c.%1$I + $3, updated_at = now()',
    col
  ) using p_key, case when p_view then 1 else 0 end, secs;

  if p_view then
    insert into public.daily_stats (day, metric, value) values (current_date, 'views_' || p_kind, 1)
    on conflict (day, metric) do update set value = daily_stats.value + 1;
  end if;
  if secs > 0 then
    insert into public.daily_stats (day, metric, value) values (current_date, 'seconds_' || p_kind, secs)
    on conflict (day, metric) do update set value = daily_stats.value + secs;
  end if;
end;
$$;

revoke all on function public.record_event(text, text, integer, boolean) from public;
grant execute on function public.record_event(text, text, integer, boolean) to anon, authenticated;
