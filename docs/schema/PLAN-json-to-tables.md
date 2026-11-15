# Plan: move the big JSON records into real tables (phase B, design only)

Today `library_books` and `lesson_extras` are one JSON value each in `site_settings`. Every save rewrites the whole value,
the size is capped by the 900 kB guard, and a damaged value affects every book or every lesson picture at once.
Phase A (done) added the guards: a broken value is never read as empty, a save cannot drop more than half the items, and
`<key>__prev` keeps the last copy. This file only designs phase B. **Needs the owner's decision before any code.**

## Target tables

`books` (from `library_books`): `id uuid pk default gen_random_uuid()`, `title text not null`, `author text not null default ''`,
`description text not null default ''`, `category_id uuid references categories(id) on delete set null`, `file_url text not null`,
`cover_url text`, `pages integer`, `sort_order integer not null default 0`, `status text not null default 'published'
check (status in ('draft','published'))`, `published_at timestamptz`, `created_at timestamptz not null default now()`.

`lesson_extras` (from `lesson_extras`): `lesson_id uuid pk references lessons(id) on delete cascade`, `featured boolean not null
default false`, `pinned_at timestamptz`, `image_url text`, `chapters jsonb not null default '[]'`.

## Policies (copied from the `lessons` policies in `docs/migrations/2026-11-05-security.sql`)

- `books`: visitors read rows where `status = 'published'`; admins read and write everything (`public.is_admin()`).
- `lesson_extras`: visitors read rows whose lesson is published; admins read and write everything.
- Revoke insert, update, delete from `anon`; grant to `authenticated` and let the policies decide.

## Order

1. Create the tables and policies (a migration file the owner runs).
2. Copy: a one-time script `scripts/copy-json-to-tables.mjs` reads the two JSON values and inserts one row per item. It is run
   by the owner, prints the counts it read and wrote, and is safe to run twice (upsert on `id`).
3. The code reads the tables and falls back to the JSON value while a table is empty or missing.
4. Stop writing the JSON values (writes go to the tables only); keep the JSON values untouched as a backup.
5. After a month without trouble, delete the two keys (and their `__prev` copies).

## Rollback

Until step 4 nothing is lost: switch the code back to reading the JSON values. After step 4, run the copy script in the
other direction (tables to JSON) from a one-off script, then switch the code back.

## What it fixes

Per-item saves (no whole-list rewrite, no lost update between two admins), a real foreign key from a book to its category,
deleted lessons cleaning their own extras, and no size ceiling.

Needs the owner's decision before any code.
