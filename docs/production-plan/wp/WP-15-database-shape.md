# WP-15: the database is described in the repository, and one bad save cannot lose a list

Closes: DAT-03 (the part code can close; the backup proof is OWNER-07), DAT-04 (phase A). Needs WP-09, WP-05.

**You cannot run SQL and you must not change data in the live database.** Everything here is files, read-only
scripts, and safer code.

## Part A (DAT-03): a schema file that matches reality

1. Create `scripts/dump-schema.mjs` (read-only). It reads `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from
   `.env.local` (same loader as `scripts/site-data.mjs`), requests `GET <url>/rest/v1/` with the headers
   `apikey` and `Authorization: Bearer <key>` (this returns the OpenAPI description of every table), and writes
   `docs/schema/tables.json`: for each table, its columns with `type`, `format`, `required`, `default`, and
   primary key. Sort tables and columns by name so the file is stable. It never prints the key.
   If `.env.local` has no service key: print "no service key; ask the owner to run `node scripts/dump-schema.mjs`"
   and exit 0. Record that in `STATE.md` under "Needs the owner" and continue with step 3 using the code only.
2. Create `scripts/schema-to-sql.mjs`: turns `tables.json` into `docs/schema/schema.sql` (`create table if not exists …`
   for every table with column types, `not null`, defaults, primary key). Header comment:
   "Generated from the live database on <date>. Indexes, foreign keys, functions and policies are in docs/migrations/."
3. Create `src/test/schemaContract.test.ts`: the list of `table -> columns the code reads or writes`, written by
   hand from `src/services/data/*.ts`, `api/*.ts`, `scripts/site-data.mjs` (grep `.from('` and `select(`). When
   `docs/schema/tables.json` exists, assert every listed column exists in it. When it does not exist, the test is
   skipped with a clear name ("schema file not generated yet").
4. `package.json`: `"schema": "node scripts/dump-schema.mjs && node scripts/schema-to-sql.mjs"`.
   `docs/migrations/README.md`: "After running any migration, run `npm run schema` and commit `docs/schema/`."
5. `docs/RUNBOOK.md`: add "Rebuilding the database from nothing": run `docs/schema/schema.sql`, then every file in
   `docs/migrations/` in the README's order, then `npm run health`. And "Restoring content": Supabase > Database >
   Backups (OWNER-07).

## Part B (DAT-04, phase A): the three big JSON records become safe to save

The records: `library_books`, `lesson_extras`, `youtube_overrides` in `site_settings` (read
`src/services/data/settings.ts`, `books.ts`, `extras.ts`, `youtube.ts` first).

1. Create `src/services/data/jsonRecord.ts`:

   ```ts
   export const MAX_RECORD_BYTES = 900_000;   // warn at 600_000
   // Parses a stored list; a broken or wrong-shaped value gives { ok: false } instead of an empty list
   export function readRecord<T>(raw: string | null, isItem: (x: unknown) => x is T): { ok: true; items: T[] } | { ok: false; reason: string }
   // Refuses to write: a list that lost more than half its items in one save (unless allowShrink), an item failing isItem, a value over the limit
   export function checkWrite<T>(before: T[], after: T[], isItem: (x: unknown) => x is T, allowShrink?: boolean): string | null
   ```

2. Use it in the three services:
   - **Read:** when `readRecord` says `ok: false`, the service throws an error with the message
     "تعذّرت قراءة البيانات المحفوظة (<key>). لم يتم تغيير شيء." and `reportError('record-broken', …)` (WP-05).
     It must **never** treat a broken record as an empty list (the next save would then erase everything).
   - **Write:** before every save call `checkWrite`; on a message, do not save and show it. The delete actions
     pass `allowShrink` only for the single-item delete.
   - **Previous copy:** before writing key `K`, write the current stored value to key `K__prev` (same table, one
     extra upsert). This gives a one-step undo with no SQL. Check first that the row-level policy allows the
     admin to write any key (read `docs/migrations/2026-11-05-security.sql`); if it restricts keys, stop and add a
     migration file for the owner instead of working around it.
3. `src/components/admin/SystemStatus.tsx` (do not grow it past 350 lines; put this in `RecordSizes.tsx`): show
   each record's size and item count, amber over 600 kB, red over 900 kB, and a button
   "استرجاع النسخة السابقة" per record that copies `K__prev` back to `K` after a confirm.
4. `api/site.ts`: the public bundle must not include the `__prev` keys (filter keys ending with `__prev`).

## Part C (DAT-04, phase B): design only, no code

Write `docs/schema/PLAN-json-to-tables.md` (at most 80 lines): for `library_books` and `lesson_extras`, the target
tables (columns, keys, policies copied from the `lessons` policies), the copy script, the order
(create tables -> copy -> code reads the table and falls back to JSON -> stop writing JSON -> delete the key), and
the rollback. End it with: "Needs the owner's decision before any code." Then stop: do not implement phase B.

## Tests

- `jsonRecord.test.ts`: broken JSON, a non-list, an item of the wrong shape -> `ok: false`; a valid list -> items;
  `checkWrite` refuses a shrink from 10 to 4, allows 10 to 9, allows 10 to 4 with `allowShrink`, refuses oversize.
- For each of the three services with the fake database (`src/test/fakeDatabase.ts`): a broken stored value makes
  read throw and a following save is impossible; a normal save writes `K__prev` with the old value.
- `api/site.test.ts`: `__prev` keys are not in the answer.
- `RecordSizes.test.tsx`: shows sizes; restore asks for a confirm and writes the previous value.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
node scripts/dump-schema.mjs      # writes docs/schema/tables.json, or prints the "no service key" line
```

## Done when

- [ ] `docs/schema/` exists (`tables.json` + `schema.sql`, or the note in `STATE.md` that the owner must run it).
- [ ] No service reads a list with `JSON.parse(...) || []` or a `catch { return [] }`
      (`grep -n "catch" src/services/data/books.ts src/services/data/extras.ts src/services/data/youtube.ts` and check each).
- [ ] `docs/schema/PLAN-json-to-tables.md` exists and no phase B code was written.
