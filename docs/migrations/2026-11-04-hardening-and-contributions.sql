-- 1. Locks the old admin_users table. The site signs admins in through Supabase Auth and the "admins" table;
--    admin_users (with a password column) came from the retired server.ts and was readable by anyone.
alter table if exists public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

-- 2. Visitor contributions. Nobody signs in: a visitor sends a suggestion, a correction or a removal request,
--    it waits in this table as "pending", and nothing on the site changes until an admin approves it.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('book', 'audio', 'video', 'correction', 'removal')),
  title text not null check (char_length(title) between 2 and 200),
  url text not null default '' check (char_length(url) <= 600),
  author text not null default '' check (char_length(author) <= 200),
  details text not null default '' check (char_length(details) <= 2000),
  target text not null default '' check (char_length(target) <= 300),
  contact text not null default '' check (char_length(contact) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text not null default '' check (char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists submissions_status_created_idx on public.submissions (status, created_at desc);

alter table public.submissions enable row level security;

-- The cap below counts rows a visitor may not read, so the count lives in a function that runs with its owner's rights
create or replace function public.pending_submissions_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.submissions where status = 'pending';
$$;

revoke all on function public.pending_submissions_count() from public;
grant execute on function public.pending_submissions_count() to anon, authenticated;

-- A visitor can only add a pending row, and only while fewer than 500 are waiting (a cap against flooding)
drop policy if exists "visitors submit pending" on public.submissions;
create policy "visitors submit pending" on public.submissions
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and admin_note = ''
    and reviewed_at is null
    and public.pending_submissions_count() < 500
  );

-- Only admins read, review, or delete them
drop policy if exists "admins manage submissions" on public.submissions;
create policy "admins manage submissions" on public.submissions
  for all using (public.is_admin()) with check (public.is_admin());

revoke all on table public.submissions from anon;
grant insert on table public.submissions to anon;

-- 3. View counters for videos and books (lessons keep their own views column)
create table if not exists public.view_counts (
  key text primary key check (char_length(key) <= 80),
  views bigint not null default 0
);

alter table public.view_counts enable row level security;

drop policy if exists "anyone reads view counts" on public.view_counts;
create policy "anyone reads view counts" on public.view_counts for select using (true);

drop policy if exists "admins manage view counts" on public.view_counts;
create policy "admins manage view counts" on public.view_counts
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.increment_view(p_key text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total bigint;
begin
  if p_key is null or p_key !~ '^(yt|book):[A-Za-z0-9_-]{3,70}$' then
    raise exception 'invalid key';
  end if;
  insert into public.view_counts as v (key, views) values (p_key, 1)
  on conflict (key) do update set views = v.views + 1
  returning v.views into total;
  return total;
end;
$$;

revoke all on function public.increment_view(text) from public;
grant execute on function public.increment_view(text) to anon, authenticated;
