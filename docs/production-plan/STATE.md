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
| 10 | WP-08 YouTube robustness | BLOCKED (partial): code merged; publish dates need YouTube to answer again (run --redate later) | prod/wp-08-youtube-robustness | 2026-11-15 | 370 | lines 23%, functions 20% |
| 11 | WP-11 admin forms | DONE | prod/wp-11-admin-forms | 2026-11-15 | 430 | lines 23%, functions 20% |
| 12 | WP-12 build, CI, documents | BLOCKED (partial): everything merged except lint, typescript-eslint does not support TypeScript 7 | prod/wp-12-build-ci-docs | 2026-11-15 | see below | lines 23%, functions 20% |
| 13 | WP-10 browser tests | DONE | prod/wp-10-browser-tests | 2026-11-15 | 437 unit + 32 browser (3 runs in a row) | lines 23%, functions 20% |
| 14 | WP-14b Quran page | DONE | prod/wp-14b-quran | 2026-11-16 | 496 unit + 35 browser | lines 38%, functions 34% |
| 15 | WP-13 performance | DONE (Part A not applied) | prod/wp-13-performance | 2026-11-15 | 446 unit + 32 browser | lines 23%, functions 20% |
| 16 | WP-15 database shape | DONE (schema file pending owner) | prod/wp-15-database-shape | 2026-11-15 | 470 | lines 23%, functions 20% |

## SQL the owner must run

- `docs/migrations/2026-11-16-hide-prev-copies.sql` (WP-15): hides the `__prev` undo copies from visitors. Run before relying on the restore button.
- `docs/migrations/2026-11-16-error-events.sql` (OWNER-09): error log table + daily cap on `record_event` (per kind, from `daily_stats`; the data has no per-key daily total).

## Needs the owner

- WP-15 Part A: `.env.local` has no `SUPABASE_SERVICE_ROLE_KEY`, so `docs/schema/tables.json` and `schema.sql` were not generated. The owner runs `npm run schema` once and commits `docs/schema/`; `src/test/schemaContract.test.ts` then starts checking the columns (it is skipped until then).
- WP-15 Part C: `docs/schema/PLAN-json-to-tables.md` needs the owner's decision before any code.

- (resolved on 2026-11-16, see the final review) WP-14b was blocked: a separate session is wiring `/quran` on `feat/quran-wire`. When that branch is finished, merge it into `prod/integration`, then add what WP-14 step 2 still requires (`timedFetch` + `sessionStorage` cache + `level: 'none'` fallback for the v4 service, the CSP hosts for mp3quran, `useHighlight` without per-frame setState, tests).

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
- 2026-11-16 (owner request, outside the 16 steps): the home card now takes a picture, a YouTube video (its first frame is the picture; Enter fills the title and the line under it) and an optional background sound; the admin tabs were renamed in plain words, the stats row was removed, and the "شكل الموقع والتواصل" tab got a jump menu. Branch `feat/home-feature-media`, merged into `prod/integration`. A second pass (`feat/admin-simplify-2`): the admin tabs are in order of daily use and all visible (they wrap instead of scrolling sideways), the site-health screen uses plain names, and the card screen shows its status under the "show" box with the title and the line under it side by side.

## Measurements

- WP-13 Lighthouse mobile, local preview, 3 runs before any change: 69, 69, 69 (median 69); LCP 1.6-1.7 s; TBT 2.8-3.3 s; CLS 0.009. After: not re-measured, Part A was not applied.
- Part A not applied: the home hero is text only (no picture to preload; LCP is already 1.7 s), the score is limited by TBT (script execution), the entry script is 44 kB gzip and nothing over 60 kB is unused on the first screen (admin is already lazy). Steps 1-3 cannot reach 85; full hydration is the next option (owner decision).
- Part B done: the welcome sound's length is saved with it (`seconds`); visitors' browsers skip a recording over 30 s, and skip the header probe when the short length is known. The admin message for a too-long recording is the existing, more detailed one.
- Part C done: `scripts/check-bundle-size.mjs`, budget 48813 bytes gzip (44375 measured + 10%), in `npm run check` and CI.
- Browser tests: 32 local + 3 live (read-only, need E2E_BASE_URL).

## Final review

### Totals (2026-11-16, measured on `prod/integration` after step 14 and the owner's later requests)

- Tests: 509 unit, component and handler tests pass (1 skipped on purpose: the schema contract, until `docs/schema/tables.json` exists); 38 browser tests pass, two full runs in a row (3 are the Quran reader, 3 are the home card: video-only first frame and open, background sound only after a tap, Enter fills the title in the admin); 3 read-only live browser checks exist (they need `E2E_BASE_URL`).
- Coverage: lines 40.9%, functions 36.7% (gate 35 / 30). Entry script 37.5 kB gzip, budget 48.8 kB.
- Files over 350 lines outside `src/data`: 0 (largest `src/context/AudioContext.tsx`, 349).
- `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run e2e` pass. `npm run lint` is only `tsc --noEmit` (see OPS-04 below). Live smoke test against https://ashraf-mazen.vercel.app: ALL PASSED.
- Not checked on the live site (that needs a sign-in and a save, which this plan forbids): the home card's picture, video and sound options. They are covered by unit, component and 3 local browser tests, and the admin tab was looked at in a screenshot. The owner tries them once from the admin after merging.

### Problem ids

closed by WP-09: TST-02, TST-03, TST-04, TST-05, INT-08; TST-01 closed for unit/handler/component/browser layers.
closed by WP-01: SEC-01, SEC-02, SEC-03, SEC-05, SEC-06, SEC-07; SEC-04 closed in code (signed upload length), live upload check pending (see Needs the owner).
closed by WP-02: REL-01. closed by WP-07: REL-02, REL-10. closed by WP-04: DAT-01, DAT-02, REL-11, SEC-11.
closed by WP-03: DAT-05, PRF-02, REL-12. closed by WP-05: OBS-01, OBS-02, OBS-03, OBS-05, OBS-06, SEC-12; SEC-08 closed once the owner runs `2026-11-16-error-events.sql` (OWNER-09).
closed by WP-06: OBS-04, PRF-04. closed by WP-11: REL-09, INT-02, INT-03, INT-09, DAT-06, DAT-07.
closed by WP-12: REL-05, REL-06, INT-01, INT-04, INT-05, INT-06, OPS-02, OPS-03, TST-06. closed by WP-10: OPS-06.
closed by WP-13: PRF-03. closed by WP-08: REL-03, INT-07 (the publish dates themselves still need one run, see Needs the owner).
closed by WP-14 (step 14, done 2026-11-16): INT-10, REL-07 (the Quran pages work without the v4 service: 8 s limit, `sessionStorage` copy, "no synchronised text" notice, tests with a dead address).
closed in code by WP-15: DAT-03 (schema file and backup proof wait for the owner: OWNER-07), DAT-04 phase A (phase B is a design file that needs the owner's decision).
owner action: SEC-09 and OWNER-01 (rotate secrets), SEC-10 and OWNER-02 (two-factor), REL-08 and OWNER-03 (custom bucket domain), REL-13 and OWNER-05 (plans), OPS-05 and OWNER-08 (leftover files), REL-04 and OWNER-06 (keep or remove downloads).
open: OPS-01 (`api/tsconfig.json` already existed; the Vercel preview log cannot be read without a push); OPS-04 (dependabot added, but no lint: typescript-eslint does not support TypeScript 7); PRF-01 (WP-13 Part A not applied: the hero is text, the score is limited by script time; full hydration is the next option).

### SQL files and owner actions still waiting

SQL (in this order): `docs/migrations/2026-11-16-error-events.sql`, `docs/migrations/2026-11-16-hide-prev-copies.sql`. Then `npm run health` and `npm run schema` (commit `docs/schema/`).
Owner actions: OWNER-01 .. OWNER-11 as in `OWNER-ACTIONS.md`, plus: set `SUPABASE_SERVICE_ROLE_KEY` in Vercel for the error log; upload one small picture from the admin after merging (checks the signed length); run `node scripts/refresh-youtube-library.mjs --redate` from a home connection; set `PRERENDER_STRICT=1` after one clean deploy; merge `prod/integration` (OWNER-10).

### BLOCKED steps and what unblocks them

- No step is blocked outright any more: step 14 was done on 2026-11-16 after the other session finished.
- Two rows are `BLOCKED (partial)`: step 10 (WP-08: the publish dates need YouTube to answer again; run `node scripts/refresh-youtube-library.mjs --redate` from a home connection, at most 3 times an hour, then commit `src/data/youtube-library.ts`) and step 12 (WP-12: lint needs a typescript-eslint release that supports TypeScript 7, or a decision to pin TypeScript 6.x, which this plan forbids).

