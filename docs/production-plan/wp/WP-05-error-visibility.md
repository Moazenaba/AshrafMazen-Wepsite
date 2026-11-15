# WP-05: every failure is written where the owner can read it

Closes: OBS-01, OBS-02 (own store), OBS-03, OBS-05, OBS-06, SEC-08, SEC-12. Needs WP-09, WP-01 (rate limiter), WP-07.

## Design

Vercel keeps logs one hour on the current plan. So failures are also stored in the site's own database, in a table
only admins can read, and shown in the admin's "البيانات والتكامل" tab. Three sources write to it:

1. server functions (`api/*.ts`) through one logger;
2. visitors' browsers through `POST /api/log` (crashes, failed uploads, blocked requests);
3. browsers' Content-Security-Policy reports through `POST /api/csp-report`.

## Steps

### 1. SQL file (the owner runs it: OWNER-09)

Create `docs/migrations/2026-11-16-error-events.sql` (safe to run twice):

```sql
create table if not exists public.error_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  source text not null check (source in ('function', 'browser', 'csp', 'monitor')),
  name text not null,            -- function name, or 'page-crash', 'upload-failed', ...
  message text not null default '',
  detail jsonb not null default '{}'::jsonb,
  path text not null default ''
);
create index if not exists error_events_at on public.error_events (at desc);
alter table public.error_events enable row level security;
revoke all on table public.error_events from anon, authenticated;
grant select, delete on table public.error_events to authenticated;
create policy "admins read errors" on public.error_events for select using (public.is_admin());
create policy "admins clear errors" on public.error_events for delete using (public.is_admin());
-- written only with the server's key (service role bypasses row level security)
```

Also in this file, limit the open analytics functions (SEC-08): add a per-day cap inside `record_event`: when the
total `p_seconds` already recorded today for that `(kind, key)` exceeds 20 hours times 1000 viewers, ignore the
call. Read the existing function in `docs/migrations/2026-11-04-analytics.sql` first and change only by adding the
guard; keep its signature.

Add the file to `docs/migrations/README.md` and to the list in `docs/PRODUCTION.md` marked "⏳ لم يُشغَّل بعد".

### 2. The server logger

Create `api/_log.ts`:

```ts
export type Level = 'info' | 'warn' | 'error';
// One line of JSON per event in the Vercel log; an 'error' is also stored in error_events (never throws, 3 s limit)
export async function logEvent(level: Level, name: string, message: string, detail?: Record<string, unknown>): Promise<void>
```

- Always `console[level](JSON.stringify({ level, fn: name, msg: message, ...detail, at: new Date().toISOString() }))`.
- For `error`: insert into `error_events` with `SUPABASE_SERVICE_ROLE_KEY` via `fetchWithTimeout(…, 3000)`; when the
  key is missing or the insert fails, only the console line is written.
- Strip values whose key matches `/key|token|secret|password|authorization/i` from `detail` before logging.
- Truncate `message` to 500 characters and `JSON.stringify(detail)` to 2000.

Replace every `console.error` / `console.warn` in `api/*.ts` with `logEvent`. Add an `error` event where a function
currently swallows a failure silently: `api/live.ts` catch branch (`name: 'live'`, message `'youtube unreachable'`),
`api/youtube-library.ts` `loadLibrary` catch (`'library build failed'`), `api/youtube-shorts.ts`.

### 3. Browser reports

Create `api/log.ts` (`POST` only): body `{ name, message, detail?, path? }`; sizes cut as above; limited with
`createLimiter(20, 600_000)` per address (WP-01); always answers `204` (never tells a bot it was refused);
stores with `logEvent('error', …)` using `source: 'browser'`.

Create `api/csp-report.ts` (`POST`): reads the report body (`csp-report` object or the Reporting API array), stores
`source: 'csp'`, `name: 'csp-violation'`, message `"<violated-directive> <blocked-uri>"`. Same limiter. Answers 204.
Then add `; report-uri /api/csp-report` to the policy in `vercel.json` (see WP-01 step 5).

Create `src/lib/reportError.ts`:

```ts
// Sends one failure to /api/log; at most 5 per page load; never throws
export function reportError(name: string, error: unknown, detail?: Record<string, unknown>): void
```

Use `navigator.sendBeacon` when available, else `fetch(..., { keepalive: true })`.

Wire it:
- `src/main.tsx`: `window.addEventListener('error', …)` and `'unhandledrejection'` -> `reportError('page-error' | 'unhandled-rejection', …)`. Ignore errors whose message matches the chunk-reload pattern in `ErrorBoundary.tsx`.
- `src/components/ErrorBoundary.tsx` `componentDidCatch` -> `reportError('page-crash', error, { stack: info.componentStack })`.
- `src/services/r2.ts` `uploadToR2`: on the storage refusing or the browser blocking -> `reportError('upload-failed', err, { kind, status })`. (This is the failure that left no trace on 2026-11-15.)

### 4. The admin sees them

`src/components/admin/SystemStatus.tsx` is 249 lines: do not grow it. Create
`src/components/admin/ErrorLog.tsx` (list of the newest 50 `error_events`: time, source, name, message; a
"مسح الكل" button with a confirm; an empty state "لا توجد أخطاء مسجّلة") and
`src/services/data/errorEvents.ts` (`getErrorEvents(limit)`, `clearErrorEvents()`), and render `<ErrorLog />` under
the system status in the same tab. When the table does not exist yet (the SQL was not run) show:
"شغّل ملف `2026-11-16-error-events.sql` في Supabase لتفعيل سجل الأخطاء."

## Tests

- `api/_log.test.ts`: writes one JSON line; removes secret-looking keys; an `error` posts to the database with the
  service key; a failed insert does not throw; nothing is posted for `info`.
- `api/log.test.ts`: 405 for GET; stores a valid report; cuts long fields; the 21st call in 10 minutes stores nothing and still answers 204.
- `api/csp-report.test.ts`: both report shapes are stored.
- `src/lib/reportError.test.ts` (jsdom): sends once per call; stops after 5; never throws when `sendBeacon` is missing.
- `src/components/admin/ErrorLog.test.tsx`: lists events; shows the "run the SQL file" hint when the query fails with a missing-table error.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
grep -rn "console\.\(error\|warn\)" api --include=*.ts | grep -v "\.test\." | grep -v "_log.ts"   # must print nothing
```

## Done when

- [ ] The grep prints nothing; all tests pass.
- [ ] `STATE.md` lists `2026-11-16-error-events.sql` under "SQL the owner must run".
