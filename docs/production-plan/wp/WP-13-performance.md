# WP-13: performance, measured before and after

Closes: PRF-01, PRF-03. Needs WP-10 (the browser tests protect the pages while this changes how they start).

This package is an **experiment with a fixed budget**. Each part is kept only if the numbers improve.

## How to measure (same way every time)

```
npm run build && npx vite preview --port 4173 &
npx lighthouse http://localhost:4173/ --preset=perf --form-factor=mobile --output=json --output-path=./lh.json --chrome-flags="--headless" --quiet
node -e "const r=require('./lh.json');console.log(Math.round(r.categories.performance.score*100), r.audits['largest-contentful-paint'].displayValue, r.audits['total-blocking-time'].displayValue, r.audits['cumulative-layout-shift'].displayValue)"
```

Run it **3 times** and take the middle score. Write "before" in `STATE.md` first. Delete `lh.json` after; never commit it.

## Part A (PRF-01): the first screen is drawn from the HTML, not after the scripts

Facts: `scripts/prerender.mjs` already writes a real HTML page per address into `dist/`, but `src/main.tsx` mounts
with `createRoot`, so React throws that HTML away and draws again after the scripts load. The largest element
(the hero) therefore appears late on a phone.

Do these steps in order; measure after each; stop at the first step that does not improve the middle score by 3 points.

1. **Hero in the static HTML with the same look.** In `scripts/prerender.mjs`, for the home page only, write the
   hero block (title, subtitle, picture when the settings have one) using the **same class names** as
   `src/pages/home/HeroSection.tsx`, and for the picture add in `<head>`:
   `<link rel="preload" as="image" href="…" fetchpriority="high">`. The picture tag gets `fetchpriority="high"`,
   `decoding="async"`, and explicit `width`/`height`.
2. **Do not blank the page while the scripts load.** Check in the browser (throttle "Slow 4G" in the dev tools, or
   Playwright's `page.route` with a delay on the script) that the static hero stays visible until React draws; if
   there is a flash of empty page, find what empties `#root` (a loading screen in `App.tsx` or a `Suspense`
   fallback) and make the fallback for the home route render nothing over the existing content.
3. **Split what the first screen does not need.** `npx vite build` prints chunk sizes. Anything over 60 kB (gzip)
   in the entry chunk that the home's first screen does not use (admin code, the PDF viewer, the Quran reader,
   charts) must be behind `lazy()` in `src/routes/lazyPages.ts`. Do not change libraries.

Do **not** switch to `hydrateRoot` or a server-rendering framework in this package: it needs every component to
render the same on the server, and a wrong attempt breaks every page. If steps 1-3 do not reach a middle score of
85, write the numbers in `STATE.md` under "Needs the owner" with the sentence "full hydration is the next option"
and stop.

## Part B (PRF-03): the welcome sound is not downloaded when it will be refused

1. `src/services/data/siteContent.ts`: when the admin saves a welcome sound, also save its length in seconds
   (read it in `WelcomeSoundSettings.tsx` with an `Audio` element's `loadedmetadata` before saving) in the same
   settings record as `welcome_sound_seconds`. Removing the sound removes the number.
2. `src/components/WelcomeSound.tsx`: when `welcome_sound_seconds` is known and greater than `MAX_WELCOME_SECONDS`
   (`welcomeSoundRules.ts`), do nothing: no `Audio` element, no request. When the number is missing (old record),
   keep today's behaviour.
3. `WelcomeSoundSettings.tsx`: refuse to save a recording longer than the limit, with the message
   "صوت الترحيب يجب ألا يزيد عن 30 ثانية."

Tests: `welcomeSoundRules.test.ts` (a rule `shouldLoadWelcome(seconds | undefined)`), a component test that no
request is made for a 60-second record, a form test for the refusal.

## Part C: a budget that fails the build when the site gets heavier

Create `scripts/check-bundle-size.mjs`: after `vite build`, sum the gzip size of the entry script and entry CSS
named in `dist/app.html`; fail (exit 1) when the script is over **the size measured today plus 10%** (write the
measured number as a constant in the script, with the date). Add it to `npm run check` after the build.
Test `scripts/check-bundle-size.test.mjs` with two fake `dist` folders (under and over).

## Verify

```
npm run typecheck && npm run test:coverage && npm run build && node scripts/check-bundle-size.mjs && npm run e2e
```

## Done when

- [ ] `STATE.md` has the before and after scores (3 runs each) and which steps of Part A were kept.
- [ ] Layout shift (CLS) did not get worse than "before".
- [ ] The bundle budget script is part of `npm run check`.
