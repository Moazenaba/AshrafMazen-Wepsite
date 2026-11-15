# STATE: progress ledger (the executor updates this after every step)

Status values: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED: reason`.
Baseline on 2026-11-15 (`main` at `2ead989`): 243 tests, all passing; no coverage measured yet; no browser tests.

| # | Step | Status | Branch | Date | Tests | Coverage |
|---|---|---|---|---|---|---|
| 1 | WP-09 test foundation | DONE | prod/wp-09-test-foundation | 2026-11-15 | 285 | lines 23%, functions 20% (gate N=20) |
| 2 | WP-14a finished branches | DONE | prod/wp-14a-finished-branches | 2026-11-15 | 289 | lines 23%, functions 20% |
| 3 | WP-01 security | DONE | prod/wp-01-security | 2026-11-15 | 302 | lines 23%, functions 20% |
| 4 | WP-02 admin session | DONE | prod/wp-02-admin-session | 2026-11-15 | 310 | lines 23%, functions 20% |
| 5 | WP-07 timeouts and degraded states | DONE | prod/wp-07-timeouts | 2026-11-15 | 321 | lines 23%, functions 20% |
| 6 | WP-04 file lifecycle | DONE | prod/wp-04-file-lifecycle | 2026-11-15 | 333 | lines 23%, functions 20% |
| 7 | WP-03 site bundle size | DONE | prod/wp-03-bundle-size | 2026-11-15 | 341 | lines 23%, functions 20% |
| 8 | WP-05 error visibility | DONE | prod/wp-05-error-visibility | 2026-11-15 | 359 | lines 23%, functions 20% |
| 9 | WP-06 monitoring | DONE | prod/wp-06-monitoring | 2026-11-15 | 364 | lines 23%, functions 20% |
| 10 | WP-08 YouTube robustness | TODO | | | | |
| 11 | WP-11 admin forms | TODO | | | | |
| 12 | WP-12 build, CI, documents | TODO | | | | |
| 13 | WP-10 browser tests | TODO | | | | |
| 14 | WP-14b Quran page | TODO | | | | |
| 15 | WP-13 performance | TODO | | | | |
| 16 | WP-15 database shape | TODO | | | | |

## SQL the owner must run

- `docs/migrations/2026-11-16-error-events.sql` (OWNER-09): error log table + daily cap on `record_event` (per kind, from `daily_stats`; the data has no per-key daily total).

## Needs the owner

- Files are deleted by key now; orphans created before WP-04 remain (clean-up is the owner's decision).

- WP-01 step 4 (signed upload length): after the merge, upload one small picture from the admin; if storage answers 403 SignatureDoesNotMatch, revert `contentLength` in `api/r2.ts` `sign` (kept, not yet checked live).
- WP-01 CSP: `report-uri /api/csp-report` added in WP-05; the mp3quran hosts are still to be added in WP-14b. Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel for the error log to store events (it is already used by `api/submit`).

- See `OWNER-ACTIONS.md` (OWNER-01 .. OWNER-11). Add new items here, one line each.

## Found on the way

- `withSiteSeed` in prerender wrote a unicode escape that JavaScript turned into a plain `<`, so a `</script` in the data could end the seed script early; fixed in `scripts/prerenderParts.mjs` because WP-09's test requires it.
- The fake database (and so `/dev/admin`) lacked the `save_setting_if_unchanged` rpc, so saving lesson extras failed there; added to `src/test/fakeDatabase.ts`.
- `/dev/admin` was not opened in a browser after the fake-database extraction (typecheck and tests pass).
- `api/site.ts` uses an inline `AbortSignal.timeout(8000)` instead of `api/_fetch.ts`, because prerender loads that file with plain Node, which cannot resolve the `.js` import.
- AdminPage's auth listener also signed the admin out when the admins query failed; fixed in WP-02.
- WP-03: PostgREST form `transcript=neq.` is accepted by the live database (HTTP 200); a positive match could not be checked because no live lesson has a transcript yet. Transcript marker is `…` (MediaIcons trims, so a space would not do).

## Measurements

(Lighthouse before/after, bundle size, browser test count)

## Final review

(written after step 16; see `GOAL.md` (repository root) section 8)
