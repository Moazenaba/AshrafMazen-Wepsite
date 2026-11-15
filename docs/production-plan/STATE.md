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
| 10 | WP-08 YouTube robustness | DONE (code); step 1 data pending | prod/wp-08-youtube-robustness | 2026-11-15 | 370 | lines 23%, functions 20% |
| 11 | WP-11 admin forms | DONE | prod/wp-11-admin-forms | 2026-11-15 | 430 | lines 23%, functions 20% |
| 12 | WP-12 build, CI, documents | DONE (lint blocked) | prod/wp-12-build-ci-docs | 2026-11-15 | see below | lines 23%, functions 20% |
| 13 | WP-10 browser tests | DONE | prod/wp-10-browser-tests | 2026-11-15 | 437 unit + 32 browser (3 runs in a row) | lines 23%, functions 20% |
| 14 | WP-14b Quran page | BLOCKED: another session is already building the Quran page on branch feat/quran-wire | | 2026-11-15 | | |
| 15 | WP-13 performance | DONE (Part A not applied) | prod/wp-13-performance | 2026-11-15 | 446 unit + 32 browser | lines 23%, functions 20% |
| 16 | WP-15 database shape | DONE (schema file pending owner) | prod/wp-15-database-shape | 2026-11-15 | 470 | lines 23%, functions 20% |

## SQL the owner must run

- `docs/migrations/2026-11-16-hide-prev-copies.sql` (WP-15): hides the `__prev` undo copies from visitors. Run before relying on the restore button.
- `docs/migrations/2026-11-16-error-events.sql` (OWNER-09): error log table + daily cap on `record_event` (per kind, from `daily_stats`; the data has no per-key daily total).

## Needs the owner

- WP-15 Part A: `.env.local` has no `SUPABASE_SERVICE_ROLE_KEY`, so `docs/schema/tables.json` and `schema.sql` were not generated. The owner runs `npm run schema` once and commits `docs/schema/`; `src/test/schemaContract.test.ts` then starts checking the columns (it is skipped until then).
- WP-15 Part C: `docs/schema/PLAN-json-to-tables.md` needs the owner's decision before any code.

- WP-14b (Quran page) is blocked: a separate session is wiring `/quran` on `feat/quran-wire`. When that branch is finished, merge it into `prod/integration`, then add what WP-14 step 2 still requires (`timedFetch` + `sessionStorage` cache + `level: 'none'` fallback for the v4 service, the CSP hosts for mp3quran, `useHighlight` without per-frame setState, tests).

- WP-12 lint NOT done: `typescript-eslint` refuses TypeScript 7 ("does not support TS 7.0", peer range `<6.1`); installing needs `--legacy-peer-deps` and still crashes at start. Unblock: the owner decides to pin `typescript` to 6.x (a dependency change this plan forbids), or waits for a typescript-eslint release that supports 7. `npm run lint` stays `tsc --noEmit`.
- WP-12 OPS-01: `api/tsconfig.json` already existed (types: node); no change was made and it cannot be checked without a push (the executor never pushes). After the owner pushes `prod/integration` to a branch, read the Vercel preview log for `error TS2688`.
- WP-12: after one clean deploy, set `PRERENDER_STRICT=1` in Vercel; to make the daily rebuild work nothing else is needed (it uses `dist/content-hash.txt`).

- WP-08 step 1 (publish dates) NOT finished: on 2026-11-15 YouTube stopped answering for watch pages after the first request (`--dry` showed 4 waiting, the real run dated 0; 228 videos undated, 3 playlists not sorted: الوابل الصيب, كتاب التوبة, ٢٠٠ سؤال وجواب). The data file was left unchanged. Someone must run `node scripts/refresh-youtube-library.mjs --redate` from a home connection later (not more than 3 times an hour), then commit `src/data/youtube-library.ts`.
- WP-08 step 5 skipped: OWNER-06 (keep or remove the download feature) is still undecided.

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
- WP-11 fixes found by the form tests: the lesson YouTube field was `type="url"` (now text); the logo screen promised SVG that the server refuses (now one shared rule); `index.css` split into `src/styles/motion.css` (was 387 lines). `/dev/admin` was not opened in a browser.
- WP-10: found by browser tests: the lesson text-size buttons had an accessible name that did not match their text (fixed); the contribute form is `noValidate`, so an empty form is sent and only the server refuses it. The local dev server must not be started with file watching off while editing (stale code); Playwright starts its own.
- Another Claude session used this same folder on 2026-11-15 and switched branches under the executor; keep one session per folder.
- WP-15: the three `catch` blocks left in `books.ts`, `extras.ts`, `youtube.ts` are the lenient parsers visitors' pages use; every admin read and every save goes through `assertReadable` and never treats a broken record as empty.

## Measurements

- WP-13 Lighthouse mobile, local preview, 3 runs before any change: 69, 69, 69 (median 69); LCP 1.6-1.7 s; TBT 2.8-3.3 s; CLS 0.009. After: not re-measured, Part A was not applied.
- Part A not applied: the home hero is text only (no picture to preload; LCP is already 1.7 s), the score is limited by TBT (script execution), the entry script is 44 kB gzip and nothing over 60 kB is unused on the first screen (admin is already lazy). Steps 1-3 cannot reach 85; full hydration is the next option (owner decision).
- Part B done: the welcome sound's length is saved with it (`seconds`); visitors' browsers skip a recording over 30 s, and skip the header probe when the short length is known. The admin message for a too-long recording is the existing, more detailed one.
- Part C done: `scripts/check-bundle-size.mjs`, budget 48813 bytes gzip (44375 measured + 10%), in `npm run check` and CI.
- Browser tests: 32 local + 3 live (read-only, need E2E_BASE_URL).

## Final review

(written after step 16; see `GOAL.md` (repository root) section 8)
