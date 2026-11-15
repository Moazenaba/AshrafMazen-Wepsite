# WP-03: the first-load answer stays small however much content there is

Closes: DAT-05, PRF-02, REL-12. Needs WP-09 done.

## Facts

- `api/site.ts` `QUERIES.lessons` is `lessons?select=*&status=eq.published&order=published_at.desc`: every column
  (including the full `transcript`) of every published lesson.
- `scripts/prerender.mjs` `withSiteSeed` writes that whole answer into **every** page it generates.
- The home page needs of a lesson only: `id, series_id, title, lesson_number, youtube_url, audio_url, status,
  published_at, created_at, views`, and whether it has a transcript (for the "مكتوب" icon).

## Steps

1. `api/site.ts`:
   - change the lessons query to select the columns above, and add a computed flag instead of the text. PostgREST
     cannot compute it, so select `transcript` **never**; instead add to the answer a field
     `transcripts: string[]` holding the ids of lessons that have one, from a second small query
     `lessons?select=id&status=eq.published&transcript=neq.` (empty-string comparison; verify the exact PostgREST
     syntax against the running database with the anon key before committing, and write the verified form here in
     `STATE.md`).
   - cap the list: `&limit=300`. The home page shows 30 latest, 6 most viewed, 8 sermons, 3 featured, 1 per category.
2. `src/services/data/siteBundleRules.ts`: add `transcripts?: string[]` to `SiteBundle`; in `buildHomeLists` give each
   lesson `transcript: bundle.transcripts?.includes(l.id) ? ' ' : ''` (a one-space marker: every consumer only tests
   truthiness; confirm with `grep -rn "\.transcript" src/pages/home src/components` and fix any that reads the text).
   `isSiteBundle` must accept an answer without `transcripts` (older saved copies).
3. `scripts/prerender.mjs` `withSiteSeed`: write the first-visit copy **only into the home page and `app.html`**,
   not into every page. Move the call from "the template" to the `write({ path: '/' … })` call and the two
   `app.html` writes. Other pages read the saved copy from the browser or fetch `/api/site`.
4. Size guard: in `scripts/prerender.mjs`, when the seed is larger than 60 000 bytes, do not write it and print
   `site seed skipped: <n> bytes is over the 60 kB limit`.
5. Stale copy (REL-12): in `src/services/data/siteBundle.ts`, when `loadSiteBundle()` fails **and** the copy in use
   came from the page (not from this browser's storage), mark it: export `seedIsStale(): boolean`. `useLiveStream`
   already asks for fresh state itself; no screen change is needed beyond not trusting a stale seed for the banner
   (it already does not).

## Tests

- `api/site.test.ts`: the lessons request address contains `select=id,series_id` and not `select=*`, and contains
  `limit=300`; the answer has `transcripts`.
- `src/services/data/siteBundleRules.test.ts`: a lesson listed in `transcripts` gets a truthy `transcript`, another
  gets `''`; a bundle without `transcripts` is still valid.
- `scripts/prerender.test.mjs`: the seed appears in the home page and not in a lesson page; a seed over the limit is
  not written.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
node -e "const s=require('fs').readFileSync('dist/index.html','utf8');console.log('home has seed:',s.includes('id=\"site-seed\"'))"
ls dist/lesson | head -1   # then check that page does NOT contain id="site-seed"
```

## Done when

- [ ] `/api/site` never sends a transcript. Checked on a local run: `npm run dev`, `curl -s localhost:3000/api/site | grep -c transcript` prints `1` (only the `transcripts` key).
- [ ] Only the home page and `app.html` carry the first-visit copy.
