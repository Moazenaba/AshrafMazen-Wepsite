# WP-10: tests in a real browser (system and functionality tests)

Closes: OPS-06 (the part code can close), and the browser layer of TST-01..05. Needs WP-09, WP-11.

## Design

Two groups of tests with Playwright (Chromium only):

1. **`e2e/local/`**: runs against `npm run dev` on port 3000. Every server answer is replaced with a fixture
   (`page.route`), so it needs no database, no network and no secrets. Runs in CI on every pull request.
   Admin screens are tested through `/dev/admin` (fake in-memory database, no login).
2. **`e2e/live/`**: read-only checks against a deployed address given in `E2E_BASE_URL` (a Vercel preview address or
   `https://ashraf-mazen.vercel.app`). Only `GET` requests, never signs in, never submits a form. Run by hand, and
   by the owner before merging a pull request.

## Steps

1. `npm install -D @playwright/test` then `npx playwright install chromium`. If the download fails twice, stop and
   record it in `STATE.md` (do not try other browsers or mirrors).
2. Create `playwright.config.ts`:
   - `testDir: 'e2e'`, `fullyParallel: true`, `retries: process.env.CI ? 1 : 0`, `reporter: [['list'], ['html', { open: 'never' }]]`;
   - project `local`: `testMatch: 'local/**/*.spec.ts'`, `use.baseURL: 'http://localhost:3000'`,
     `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120000 }`;
   - project `live`: `testMatch: 'live/**/*.spec.ts'`, `use.baseURL: process.env.E2E_BASE_URL`; skipped when the variable is empty;
   - `use: { locale: 'ar-EG', trace: 'retain-on-failure', screenshot: 'only-on-failure' }`.
3. `package.json` scripts: `"e2e": "playwright test --project=local"`, `"e2e:live": "playwright test --project=live"`.
   Add `playwright-report/`, `test-results/` to `.gitignore`. Exclude `e2e/**` from Vitest (`vite.config.ts` test `exclude`).
4. Create `e2e/fixtures/`:
   - `site.json`: a small site bundle (2 categories, 2 series, 6 lessons: one video, one audio, one written, one
     draft, one with a picture, one featured; 2 books; settings with a hero title). Build it from the shapes in
     `src/test/factories.ts`; do not copy real data.
   - `library.json` (2 playlists, 3 videos each), `live-off.json` `{ "live": false }`, `live-on.json`.
   - `e2e/fixtures/mock.ts`: `export async function mockServer(page, overrides?)` that routes `**/api/site`,
     `**/api/live`, `**/api/youtube-library`, `**/api/youtube-shorts`, `**/api/log`, `**/api/submit`, and every
     request to `*.supabase.co` (answer `[]` with status 200), and **aborts** requests to `youtube.com`,
     `ytimg.com`, `mp3quran.net`. It also collects console errors: `export function consoleErrors(page): string[]`.
5. Write `e2e/local/` specs. Every test ends with `expect(consoleErrors(page)).toEqual([])`.

   | File | Cases |
   |---|---|
   | `home.spec.ts` | the page has the hero title from the fixture; the featured lesson is shown; the draft lesson is **not** shown; `html[dir=rtl]` |
   | `navigation.spec.ts` | every link in the top bar and the side menu opens a page with a non-empty `h1` and no error boundary text; the browser's back button works |
   | `lesson.spec.ts` | video lesson shows a player frame; audio lesson: pressing play shows the bottom player; written lesson shows its text; an unknown lesson id shows the "not found" state |
   | `search.spec.ts` | typing a word from a fixture title lists that lesson; a word with different Arabic letter forms (أ/ا, ة/ه) still finds it; nonsense shows the empty state |
   | `books.spec.ts` | the library lists 2 books; opening one shows its title |
   | `live.spec.ts` | with `live-off.json` no banner; with `live-on.json` the banner is on the home page and on a lesson page, and `/live` shows a frame whose `src` contains the fixture video id |
   | `contribute.spec.ts` | an empty form shows validation messages and sends nothing; a valid form posts once to `/api/submit` (assert the request body) and shows the thank-you state; a 500 answer shows an error message and keeps the typed text |
   | `degraded.spec.ts` | `/api/site` answering 500: the page shows the retry state, not a blank page; `/api/youtube-library` answering 500: the home page still renders the lessons |
   | `mobile.spec.ts` | viewport 375x812: no horizontal scroll (`document.documentElement.scrollWidth <= clientWidth`) on home, a lesson, the library; the menu button opens the menu |
   | `a11y.spec.ts` | install `@axe-core/playwright`; home, a lesson, the library, `/contribute`: no violations of impact `critical` or `serious` |
   | `admin.spec.ts` (`/dev/admin`) | each tab opens with no console error; create a category, a series, a lesson, then see the lesson in the list; edit its title; delete it with the confirm window; an invalid lesson form shows its message and does not close |

6. Write `e2e/live/smoke.spec.ts` (read-only): home answers 200 and shows an `h1`; `/api/site` JSON has lessons;
   the first lesson link opens; `/admin` shows the login form (and nothing of the dashboard); no console errors on
   these three pages; the response of `/` has `content-security-policy`.
7. CI: in `.github/workflows/ci.yml` add a job `e2e` after the unit job: checkout, setup-node 22, `npm ci`,
   `npx playwright install --with-deps chromium`, `npm run e2e`, upload `playwright-report` as an artifact when it fails.
   (`ci.yml` runs on pull requests only, so it does not use scheduled minutes.)
8. `docs/RUNBOOK.md`: add "Before merging": `E2E_BASE_URL=<preview address> npm run e2e:live`.

## Rules for flaky tests

- Never use `waitForTimeout`. Wait for a role or text (`expect(locator).toBeVisible()`).
- Select by role and name (`getByRole('button', { name: '...' })`), never by CSS class.
- A test that fails once in three local runs is fixed or deleted before the package is done; never mark it `skip`
  without a line in `STATE.md` saying why.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
npm run e2e          # run it 3 times: all three must pass
```

## Done when

- [ ] 11 local spec files and 1 live spec file exist and pass 3 runs in a row.
- [ ] The CI job `e2e` exists.
- [ ] `STATE.md` records the number of browser tests.
