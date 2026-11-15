# STATE: progress ledger (the executor updates this after every step)

Status values: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED: reason`.
Baseline on 2026-11-15 (`main` at `2ead989`): 243 tests, all passing; no coverage measured yet; no browser tests.

| # | Step | Status | Branch | Date | Tests | Coverage |
|---|---|---|---|---|---|---|
| 1 | WP-09 test foundation | DONE | prod/wp-09-test-foundation | 2026-11-15 | 285 | lines 23%, functions 20% (gate N=20) |
| 2 | WP-14a finished branches | DONE | prod/wp-14a-finished-branches | 2026-11-15 | 289 | lines 23%, functions 20% |
| 3 | WP-01 security | TODO | | | | |
| 4 | WP-02 admin session | TODO | | | | |
| 5 | WP-07 timeouts and degraded states | TODO | | | | |
| 6 | WP-04 file lifecycle | TODO | | | | |
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

- See `OWNER-ACTIONS.md` (OWNER-01 .. OWNER-11). Add new items here, one line each.

## Found on the way

- `withSiteSeed` in prerender wrote `'<'` (a plain `<`), so a `</script` in the data could end the seed script early; fixed in `scripts/prerenderParts.mjs` because WP-09's test requires it.
- The fake database (and so `/dev/admin`) lacked the `save_setting_if_unchanged` rpc, so saving lesson extras failed there; added to `src/test/fakeDatabase.ts`.
- `/dev/admin` was not opened in a browser after the fake-database extraction (typecheck and tests pass).

## Measurements

(Lighthouse before/after, bundle size, browser test count)

## Final review

(written after step 16; see `GOAL.md` (repository root) section 8)
