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
| 7 | WP-03 site bundle size | TODO | | | | |
| 8 | WP-05 error visibility | TODO | | | | |
| 9 | WP-06 monitoring | TODO | | | | |
| 10 | WP-08 YouTube robustness | TODO | | | | |
| 11 | WP-11 admin forms | TODO | | | | |
| 12 | WP-12 build, CI, documents | TODO | | | | |
| 13 | WP-10 browser tests | TODO | | | | |
| 14 | WP-14b Quran page | TODO | | | | |
| 15 | WP-13 performance | TODO | | | | |
| 16 | WP-15 database shape | TODO | | | | |

## SQL the owner must run

(none yet)

## Needs the owner

- Files are deleted by key now; orphans created before WP-04 remain (clean-up is the owner's decision).

- WP-01 step 4 (signed upload length): after the merge, upload one small picture from the admin; if storage answers 403 SignatureDoesNotMatch, revert `contentLength` in `api/r2.ts` `sign` (kept, not yet checked live).
- WP-01 CSP: mp3quran hosts and `report-uri /api/csp-report` not added yet (Quran branch and WP-05 are not merged); add them in WP-14b / WP-05.

- See `OWNER-ACTIONS.md` (OWNER-01 .. OWNER-11). Add new items here, one line each.

## Found on the way

- `withSiteSeed` in prerender wrote a unicode escape that JavaScript turned into a plain `<`, so a `</script` in the data could end the seed script early; fixed in `scripts/prerenderParts.mjs` because WP-09's test requires it.
- The fake database (and so `/dev/admin`) lacked the `save_setting_if_unchanged` rpc, so saving lesson extras failed there; added to `src/test/fakeDatabase.ts`.
- `/dev/admin` was not opened in a browser after the fake-database extraction (typecheck and tests pass).
- `api/site.ts` uses an inline `AbortSignal.timeout(8000)` instead of `api/_fetch.ts`, because prerender loads that file with plain Node, which cannot resolve the `.js` import.
- AdminPage's auth listener also signed the admin out when the admins query failed; fixed in WP-02.

## Measurements

(Lighthouse before/after, bundle size, browser test count)

## Final review

(written after step 16; see `GOAL.md` (repository root) section 8)
