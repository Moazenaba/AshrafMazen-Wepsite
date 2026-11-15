# Problems: seeing failures, testing, performance, build and operations

Audit date: 2026-11-15, commit `2ead989`. Severity as in `01-security.md`.

## Observability: when something breaks, nobody is told

| ID | Sev | Problem | Where | Evidence | Fixed by |
|---|---|---|---|---|---|
| OBS-01 | H | A crash in a visitor's browser is written only to that visitor's own console. There is no global `error` / `unhandledrejection` handler and nothing is sent to the server. | `src/components/ErrorBoundary.tsx` (`console.error`), no handler in `src/` | `grep unhandledrejection` finds nothing. | WP-05 |
| OBS-02 | H | Server logs live one hour on the current plan and the status of outgoing calls is hidden. The upload failure of 2026-11-15 left no trace anywhere (the browser talked to the storage directly). | Vercel plan (Hobby), log screens | Seen in the dashboard. | WP-05 (own error store), OWNER-05 |
| OBS-03 | M | Server functions log free text with `console.error`. There is no request id, no function name field, no level, so logs cannot be searched or counted. | all `api/*.ts` | Read the functions. | WP-05 |
| OBS-04 | H | Nothing watches the live site. An outage, an expired key or a broken deploy is noticed only when a visitor complains. `npm run smoke` and `npm run health` exist but are run by hand. | `scripts/smoke-test.mjs`, `scripts/health-check.ts`, no scheduled workflow | Listed `.github/workflows` (only `ci.yml`, `sync-youtube.yml`). | WP-06 |
| OBS-05 | M | When scraping YouTube fails at run time the functions answer "not live" / "the saved library" without recording that they failed. | `api/live.ts` catch branch, `api/youtube-library.ts` `loadLibrary` | Read the code. | WP-05, WP-08 |
| OBS-06 | M | No Content-Security-Policy reports, so a blocked script or request in a visitor's browser is never seen. | `vercel.json` | No `report-uri` / `report-to`. | WP-05 |

## Testing: what is proven and what is not

243 unit tests pass (`npm test`, no browser, no network). They cover pure rules well. Not covered:

| ID | Sev | Problem | Evidence | Fixed by |
|---|---|---|---|---|
| TST-01 | H | No component test and no browser test. 0 of 25 files in `src/components`, 0 of 11 in `src/components/admin`, 0 of 15 in `src/pages` have a test. Two bugs of this session (a form that could not be submitted; a picture the admin could not see) were only found by hand on the live site. | Scripted inventory of `*.test.ts` per folder. | WP-09, WP-10 |
| TST-02 | H | No test exercises a server function's handler end to end except `submit`, `r2` (GET) and `youtube-library`. `site`, `live`, `media-link`, `youtube-shorts`, `sitemap-videos`, and `r2` POST (sign / delete / status, the admin check) are untested. | Read `api/*.test.ts`. | WP-09 |
| TST-03 | M | No test of the data layer against a database: every query string, the bundle-vs-direct equality (INT-08), the admin operations with their partial failures. | Inventory. | WP-09 |
| TST-04 | M | The scripts that build and sync (`prerender`, `generate-sitemap`, `refresh-youtube-library`, `smoke-test`) have no test (0 of 11). | Inventory. | WP-09 |
| TST-05 | M | CI runs types, unit tests and a build, with a placeholder database. It runs no browser test, no accessibility check, no check of the deployed site, and no coverage threshold. | `.github/workflows/ci.yml` | WP-09, WP-10 |
| TST-06 | L | There is no linter; `npm run lint` is the type check again. 86 uses of `any`. | `package.json` scripts; `grep ": any"`. | WP-12 |

## Performance and cost

| ID | Sev | Problem | Evidence | Fixed by |
|---|---|---|---|---|
| PRF-01 | M | Mobile Lighthouse about 70 (measured locally 69-74): the largest element is drawn by React after the scripts run. A real fix means rendering the page's HTML at build time and hydrating it. | Lighthouse runs of 2026-11-13. | WP-13 |
| PRF-02 | M | See DAT-05: the first-visit copy grows with content and is repeated in every page. | | WP-03 |
| PRF-03 | L | The welcome-sound check downloads the header of the saved recording on every first page view even when it will be refused for being long. | `src/components/WelcomeSound.tsx` | WP-13 |
| PRF-04 | M | The sync job runs every 30 minutes on a private repository: about 1440 of the 2000 free Actions minutes a month. Adding a monitor (OBS-04) must be budgeted against the same allowance. | `.github/workflows/sync-youtube.yml` | WP-06 |

## Build, deploy, operations

| ID | Sev | Problem | Evidence | Fixed by |
|---|---|---|---|---|
| OPS-01 | M | Every deploy prints `error TS2688: Cannot find type definition file for 'node'` 11 times: Vercel compiles each function with the project's TypeScript 7 and forces `types: ["node"]`. The deploy succeeds; the noise hides real errors. | Vercel build log of `2ead989`. | WP-12 |
| OPS-02 | M | Vercel deploys only commits authored by the owner's GitHub account; any other author is "Blocked" with no notification. The identity is hard-coded in `.github/workflows/sync-youtube.yml` and in the local git config of this clone. | Vercel deployment page (2026-11-14). | WP-12 (document + check) |
| OPS-03 | L | No `engines` field: the Node version is whatever Vercel and the runner default to. The sync job needs Node 22.18+ (it imports a `.ts` file directly). | `package.json` | WP-12 |
| OPS-04 | M | Dependencies use `^` ranges on very new major versions (TypeScript 7, Vite 8, React 19, Vitest 5) and nothing reports updates or advisories. | `package.json` | WP-12 |
| OPS-05 | L | Leftovers in the folder: `AshrafMazen-Wepsite-main.rar`, `bun.lock`, old `docs/audit/00-02`, a second stale copy of the project next to this clone. | `ls` | OWNER-08 |
| OPS-06 | M | No staging: a change is first seen by real visitors. Preview deployments exist but are blocked for non-owner authors (OPS-02) and share the production database. | Vercel deployments list. | WP-10 (preview test), OWNER-05 |
