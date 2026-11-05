-- Site analytics, with no accounts and no personal data. A visitor is a random id kept in the browser.
--   * who is on the site right now (a ping every minute while a page is open)
--   * how many different visitors came each day
--   * views and time spent, by kind (video, audio, reading) and by item (a lesson, a channel video, a book)
-- Everything is written through small functions that check their input, and only admins can read the totals.
-- Safe to run again.

-- The earlier, simpler counter is replaced by the tables below
drop function if exists public.increment_view(text);
drop table if exists public.view_counts;

-- ---------------------------------------------------------------- tables
create table if not exists public.visitor_pings (
  vid text primary key check (char_length(vid) between 8 and 64),
  last_seen timestamptz not null default now()
);

create table if not exists public.daily_visitors (
  day date not null,
  vid text not null check (char_length(vid) between 8 and 64),
  primary key (day, vid)
);

-- Per item: key is 'lesson:<id>', 'yt:<video id>' or 'book:<id>'
create table if not exists public.content_stats (
  key text primary key check (key ~ '^(lesson|yt|book):[A-Za-z0-9_-]{3,70}$'),
  views bigint not null default 0,
  video_seconds bigint not null default 0,
  audio_seconds bigint not null default 0,
  read_seconds bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Per day: metric is 'views_video', 'seconds_audio', 'pageviews' and so on
create table if not exists public.daily_stats (
  day date not null,
  metric text not null check (metric ~ '^(views|seconds)_(video|audio|read)$|^pageviews$'),
  value bigint not null default 0,
  primary key (day, metric)
);

alter table public.visitor_pings enable row level security;
alter table public.daily_visitors enable row level security;
alter table public.content_stats enable row level security;
alter table public.daily_stats enable row level security;

revoke all on table public.visitor_pings, public.daily_visitors, public.content_stats, public.daily_stats from anon, authenticated;

-- Item counts are public (a page can show how many times it was watched); the rest is for admins only
drop policy if exists "anyone reads content stats" on public.content_stats;
create policy "anyone reads content stats" on public.content_stats for select using (true);
grant select on table public.content_stats to anon, authenticated;

drop policy if exists "admins read analytics tables" on public.daily_stats;
create policy "admins read analytics tables" on public.daily_stats for select using (public.is_admin());
drop policy if exists "admins read visitor tables" on public.daily_visitors;
create policy "admins read visitor tables" on public.daily_visitors for select using (public.is_admin());
drop policy if exists "admins read pings" on public.visitor_pings;
create policy "admins read pings" on public.visitor_pings for select using (public.is_admin());

-- ---------------------------------------------------------------- writing
-- A visitor says "I am here". Also counts them once for the day.
create or replace function public.ping_visitor(p_vid text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_vid is null or char_length(p_vid) not between 8 and 64 or p_vid !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'invalid visitor id';
  end if;
  insert into public.visitor_pings (vid, last_seen) values (p_vid, now())
  on conflict (vid) do update set last_seen = now();
  insert into public.daily_visitors (day, vid) values (current_date, p_vid) on conflict do nothing;
  -- housekeeping, now and then: forget pings older than an hour and visitors older than 120 days
  if random() < 0.02 then
    delete from public.visitor_pings where last_seen < now() - interval '1 hour';
    delete from public.daily_visitors where day < current_date - 120;
  end if;
end;
$$;

-- One report from a page: a view and/or some seconds of watching, listening or reading
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

revoke all on function public.ping_visitor(text) from public;
revoke all on function public.record_event(text, text, integer, boolean) from public;
grant execute on function public.ping_visitor(text) to anon, authenticated;
grant execute on function public.record_event(text, text, integer, boolean) to anon, authenticated;

-- ---------------------------------------------------------------- reading (admins only)
create or replace function public.admin_stats(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  days integer := greatest(1, least(coalesce(p_days, 30), 365));
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'admins only';
  end if;

  select jsonb_build_object(
    'live', (select count(*) from public.visitor_pings where last_seen > now() - interval '2 minutes'),
    'visitors_today', (select count(*) from public.daily_visitors where day = current_date),
    'visitors_7d', (select count(distinct vid) from public.daily_visitors where day > current_date - 7),
    'visitors_30d', (select count(distinct vid) from public.daily_visitors where day > current_date - 30),
    'totals', jsonb_build_object(
      'pageviews', coalesce((select sum(value) from public.daily_stats where metric = 'pageviews'), 0),
      'views_video', coalesce((select sum(value) from public.daily_stats where metric = 'views_video'), 0),
      'views_audio', coalesce((select sum(value) from public.daily_stats where metric = 'views_audio'), 0),
      'views_read', coalesce((select sum(value) from public.daily_stats where metric = 'views_read'), 0),
      'seconds_video', coalesce((select sum(value) from public.daily_stats where metric = 'seconds_video'), 0),
      'seconds_audio', coalesce((select sum(value) from public.daily_stats where metric = 'seconds_audio'), 0),
      'seconds_read', coalesce((select sum(value) from public.daily_stats where metric = 'seconds_read'), 0)
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'metric', d.metric, 'value', d.value) order by d.day)
      from public.daily_stats d where d.day > current_date - days
    ), '[]'::jsonb),
    'daily_visitors', coalesce((
      select jsonb_agg(jsonb_build_object('day', v.day, 'visitors', v.n) order by v.day)
      from (select day, count(*) n from public.daily_visitors where day > current_date - days group by day) v
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', c.key, 'views', c.views,
        'video_seconds', c.video_seconds, 'audio_seconds', c.audio_seconds, 'read_seconds', c.read_seconds
      ) order by c.views desc)
      from public.content_stats c
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_stats(integer) from public;
grant execute on function public.admin_stats(integer) to authenticated;
