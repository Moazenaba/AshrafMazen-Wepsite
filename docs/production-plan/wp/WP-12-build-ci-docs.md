# WP-12: build, continuous integration, and documents that tell the truth

Closes: REL-05, REL-06, INT-01, INT-04, INT-05, INT-06, OPS-01, OPS-02, OPS-03, OPS-04, TST-06. Needs WP-09 done.

## Steps

### 1. The CORS rule that broke uploads cannot come back (INT-01)

- `scripts/r2-setup.ts`: its list of allowed origins must contain `https://ashraf-mazen.vercel.app` **first**, keep
  `https://ashraf-mazen-wepsite.vercel.app` and `http://localhost:3000`. Read the script: origins can also come from
  `R2_CORS_ORIGINS`; keep that.
- `docs/r2-cors.json`: same three origins.
- Test `scripts/r2-cors.test.mjs`: parse `docs/r2-cors.json` and assert the allowed origins include
  `https://ashraf-mazen.vercel.app` and the methods include `PUT`.

### 2. A build that could not read the database says so (REL-05)

- `scripts/prerender.mjs` and `scripts/generate-sitemap.mjs`: when run with `--soft` and the data cannot be read,
  they still exit 0, but print one line starting with `::warning::` (GitHub's annotation format) **and** write
  `dist/build-warnings.json` `{ prerender: false, reason }`.
- `scripts/smoke-test.mjs` (after WP-06): fetch `/build-warnings.json`; when it exists and says `prerender: false`,
  the check `prerendered pages` is `FAIL`.
- On Vercel the variable `VERCEL_ENV=production` is set: in production builds drop `--soft` behaviour for the
  prerender **only when** `PRERENDER_STRICT=1` is set (document it; the owner turns it on after one clean deploy).

### 3. New content reaches Google without waiting for a code change (REL-06)

Add to `.github/workflows/sync-youtube.yml` a second trigger path: once a day (`cron: '15 3 * * *'`, a separate
`schedule` entry in the **same** workflow) the job also runs `node scripts/check-content-changed.mjs`.
Create that script: it fetches `https://ashraf-mazen.vercel.app/api/site`, hashes the ids and `published_at` of the
lessons, compares with `/content-hash.txt` served by the site (written at build time by `scripts/prerender.mjs`
into `dist/content-hash.txt`), and when they differ makes an empty commit
"Rebuild: published content changed" (same author settings as the sync step) and pushes, which deploys.
Test `scripts/check-content-changed.test.mjs`: same hash -> no commit; different -> asks for a rebuild; a failed
fetch -> no commit and exit 0.

### 4. Node, TypeScript, lint (OPS-01, OPS-03, OPS-04, TST-06)

- `package.json`: add `"engines": { "node": ">=22.18" }`.
- OPS-01: the noise comes from Vercel compiling `api/*.ts` with the project's TypeScript 7. Add `api/tsconfig.json`:
  `{ "extends": "../tsconfig.json", "compilerOptions": { "types": ["node"], "typeRoots": ["../node_modules/@types"] }, "include": ["./**/*.ts", "../src/data/youtube-library.ts", "../src/constants/*.js"] }`.
  Push to a branch and read the **preview** build log on Vercel (project `ashraf-mazen`): the line
  `error TS2688` must be gone. If it is still there, remove the file again and record "OPS-01 not fixed by
  api/tsconfig.json" in `STATE.md`; do not try a second approach without the owner.
- Lint: `npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks`; create `eslint.config.js`
  with the recommended sets, `react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: warn`,
  `@typescript-eslint/no-explicit-any: warn`, `@typescript-eslint/no-floating-promises: error` (needs
  `parserOptions.project`). Change `"lint": "eslint ."`. Fix every **error**; leave warnings. Add `npm run lint` to
  `check` and to `.github/workflows/ci.yml`.
- Dependencies: add `.github/dependabot.yml` (npm, weekly, grouped minor+patch, max 5 open). Do not change any
  version by hand in this package.

### 5. Documents (INT-04, INT-05, INT-06, OPS-02)

- `CLAUDE.md` "Deploy": the Vercel project is **`ashraf-mazen`** (dashboard `https://vercel.com/moaz-6856/ashraf-mazen`);
  Vercel deploys only commits authored by the owner's GitHub account, any other author shows "Blocked".
- `docs/PRODUCTION.md`: same correction; mark `2026-11-05-concurrent-saves.sql` as run (it answers "admins only").
- `.env.example`: add `R2_PUBLIC_URL`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `R2_CORS_ORIGINS`,
  `PRERENDER_STRICT` with a one-line comment each.
- Fix the "6 hours" comments in `api/youtube-library.ts` and `api/youtube-shorts.ts` to the real times (read the
  constants).
- Guard test `src/test/envDocs.test.ts`: every `process.env.X` / `import.meta.env.X` name used in `api/`, `src/`,
  `scripts/`, `vite.config.ts` (except `DEV`, `MODE`, `PROD`, `VERCEL_ENV`, `DISABLE_HMR`) appears in `.env.example`.

## Verify

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

## Done when

- [ ] `npm run lint` has 0 errors.
- [ ] The three guard tests pass (`r2-cors`, `envDocs`, `check-content-changed`).
- [ ] `STATE.md` records the outcome of the OPS-01 attempt.
