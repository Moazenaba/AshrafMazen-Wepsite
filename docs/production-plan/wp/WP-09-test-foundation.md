# WP-09: test foundation (do this one FIRST)

Closes: TST-01 (first half), TST-02, TST-03, TST-04, TST-05 (coverage), INT-08.
Every later package adds tests with the tools set up here. Do not skip it.

## Goal

After this package the project can test: a React component in a fake browser (jsdom), a server function's handler
with a fake request, the data layer against a fake database, and CI refuses a drop in coverage.

## Steps

### 1. Component testing tools

1. `npm install -D jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
2. Edit `vitest.config.ts`: keep `environment: 'node'` as the default; set
   `include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts', 'scripts/**/*.test.mjs']` and `setupFiles: ['src/test/setup.ts']`.
   Every component test file starts with the line `// @vitest-environment jsdom` (this works in every Vitest
   version; do not use `environmentMatchGlobs`, it was removed).
3. Create `src/test/setup.ts`: `import '@testing-library/jest-dom/vitest';` and after each test call `cleanup()` from
   `@testing-library/react` (guard with `typeof document !== 'undefined'`).
4. Create `src/test/render.tsx` exporting `renderWithProviders(ui, { route = '/' })` that wraps `ui` in
   `MemoryRouter` (initialEntries `[route]`), `ThemeProvider` and `AudioProvider` (read `src/App.tsx` for the
   real nesting order and copy it).

### 2. First component tests (prove the tools; each is a regression test for a real past bug)

Create these files, each with the listed cases:

- `src/components/LessonThumb.test.tsx`
  - shows the admin's picture first when `imageUrl` is given;
  - falls back to the YouTube picture when the admin's picture fires `error`;
  - shows the icon when there is neither a picture nor a YouTube link.
- `src/components/admin/modals/lesson/AudioField.test.tsx`
  - the link field is NOT `type="url"` (assert `input.type === 'text'`);
  - a value `/api/r2?file=audio%2Fx.ogg` leaves `form.checkValidity()` true. (Regression for REL-09.)
- `src/components/admin/branding/HomeFeatureSettings.test.tsx` (mock `../../../services/data/siteContent`)
  - status line says the card is off when `enabled` is false;
  - uploading a picture (call the `onUploaded` prop of the mocked `FileUploadButton`) switches the card on.
- `src/components/LiveBanner.test.tsx` (mock `../hooks/useLiveStream`)
  - renders nothing when nothing is live; shows "شاهد البث" for a YouTube live; shows the Telegram button only.

### 3. Server function handler tests

Create `api/_testing.ts` exporting `fakeRes()` (records `statusCode`, headers, body; supports `status().send()`,
`setHeader`, `end`) and `fakeReq({ method, query, body, headers })`. Reuse it in existing `api/*.test.ts` only if
that is a one-line change; do not rewrite them.

Add tests (stub `fetch` with `vi.stubGlobal`, stub env with `vi.stubEnv`, never touch the network):

- `api/site.test.ts`: 503 when the database address or key is missing; 200 with all five lists and the cache header
  when the database answers; 502 and `no-store` when one query fails.
- `api/live.test.ts`: `{live:false}` when YouTube answers the channel page; `{live:true, videoId, title}` for a live
  page of the right channel; `{live:false}` with the short cache when `fetch` throws; every request address contains `hl=ar`.
- `api/r2.post.test.ts`: 403 without a token; 403 when the token's user is not in `admins`; `sign` refuses a wrong
  extension and an oversize file and answers a signed address for a valid one; `delete` refuses a link that is not a
  site file.
- `api/media-link.test.ts`: 400 for a malformed id; 403 for a video that is not the channel's; 502 with the list of
  tried services when every service fails.

### 4. Data layer against a fake database

`src/dev/AdminHarness.tsx` already contains an in-memory fake of the database for `/dev/admin`: `sampleData()`,
`query(table)`, `rpc(name)` and `install()` (which replaces the methods of the `supabase` object and `window.fetch`).
Move `sampleData`, `query`, `rpc` and the row helpers (no behaviour change) to `src/test/fakeDatabase.ts`, export
`installFakeDatabase(rows?)` and `resetFakeDatabase()`, and make the harness import them. Then add:

- `src/services/data/lessonsAdmin.test.ts`: create, update and delete a lesson; `updateLesson` keeps the first
  publish date; deleting a lesson clears its extras.
- `src/services/data/bundleContract.test.ts` (INT-08): with the same rows, `buildHomeLists(bundle)` and the direct
  functions (`getFeaturedLessons`, `getLatestLessons`, `getCategoriesWithPortalData`) return lessons with the same
  ids in the same order **and the same `image`**.

### 5. Script tests

- `scripts/prerender.test.mjs`: export the pure parts of `scripts/prerender.mjs` (the `render` function and
  `withNameFont`) and test: a page gets its own title and canonical address; `<` in a title is escaped; the
  first-visit copy is written once and contains no `</script`.

### 6. Coverage gate

1. `npm install -D @vitest/coverage-v8`
2. In `vitest.config.ts` add `coverage: { provider: 'v8', include: ['src/**', 'api/**'], exclude: ['src/data/**', 'src/dev/**', '**/*.test.*'], thresholds: { lines: N, functions: N } }`
   where `N` is the measured value rounded **down** to a multiple of 5 (run `npx vitest run --coverage` first).
3. Add script `"test:coverage": "vitest run --coverage"` and make `.github/workflows/ci.yml` run it instead of `npm test`.

## Verify

```
npm run typecheck
npm run test:coverage
npm run build
```

All three must pass. Record the measured coverage and `N` in `STATE.md`.

## Done when

- [ ] The four component test files, four handler test files, two data tests and one script test exist and pass.
- [ ] `src/dev/AdminHarness.tsx` still works: `npm run dev`, open `/dev/admin`, the dashboard lists lessons.
- [ ] CI runs coverage with a threshold.

## Do not

- Do not change application behaviour in this package (only extract the fake database).
- Do not lower an existing assertion to make a test pass.
