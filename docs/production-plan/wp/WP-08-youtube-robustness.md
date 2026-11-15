# WP-08: YouTube data stays right, and says so when it cannot be read

Closes: REL-03, REL-04 (health part), INT-07, OBS-05. Needs WP-05, WP-07, and `feat/youtube-order` merged (WP-14 step 1).

## Facts measured on 2026-11-15

- YouTube's RSS feeds answer 404/403 most of the time from servers, 200 sometimes. They are not used by the runtime
  library or the sync job any more. `api/youtube-shorts.ts` still asks the Shorts feed.
- A server asking for a few hundred watch pages in a row gets limited: 372 dates in one run, 31 in the next, then
  HTTP 302. The sync job already asks gently (2 at a time, 350 ms apart, stops after 6 misses).
- Every page must be asked with `hl=ar&gl=EG` (`withArabic` in `api/_youtubePage.ts`), or servers in the USA get
  YouTube's English translation of the titles.

## Steps

### 1. Finish the publish dates (one time)

Run from a normal home or office connection, **not** in a loop:

```
node scripts/refresh-youtube-library.mjs --dry      # read the line "N dated ... M waiting for dates"
node scripts/refresh-youtube-library.mjs --redate   # writes src/data/youtube-library.ts
node scripts/refresh-youtube-library.mjs            # must print "0 new, 0 renamed, 0 removed, 0 dated"
```

If the `--redate` run prints "YouTube stopped answering", stop, wait at least 30 minutes, run it again (it only asks
for what is still missing when run **without** `--redate` after the first pass). Never run it more than 3 times in
an hour. When "waiting for dates" is 0, check and commit:

```
node -e "const s=require('fs').readFileSync('src/data/youtube-library.ts','utf8');const a=s.indexOf('= [',s.indexOf('export const YOUTUBE_LIBRARY'));const L=JSON.parse(s.slice(a+2,s.lastIndexOf('];')+1));for(const p of L){const d=p.videos.map(v=>Date.parse(v.published));console.log(p.title,d.every((x,i)=>i===0||d[i-1]>=x)?'newest first':'NOT SORTED')}"
```

Every playlist must print `newest first`. If one prints `NOT SORTED`, stop and record it in `STATE.md`; do not hand-edit the data file.

### 2. The runtime library keeps the same order

`api/youtube-library.ts` `build`: playlists found on the channel at run time (`discovered`) and the admin's playlists
get `published` only as "now". After building `playlists`, apply `inChannelOrder(playlists, <ids from the channel
playlists page>)` (import from `./_youtubePage.js`; the page is already fetched by `discoverPlaylists`, so return its
ids from that function instead of fetching twice). Do not sort videos here: the saved library is already sorted.

### 3. Shorts without RSS (INT-07)

Read `api/youtube-shorts.ts` and `api/_shorts.ts`. Remove the feed request; keep the page scrape; ask with
`withArabic` and `YOUTUBE_HEADERS`. If the answer is empty, return the last good answer kept in memory, and
`logEvent('error', 'youtube-shorts', 'no shorts read')`.

### 4. A failed read is recorded, and the admin sees YouTube's state

- `api/live.ts`: distinguish "YouTube answered and the channel is not live" from "YouTube did not answer or the page
  had no player data": in the second case `logEvent('warn', 'live', 'page not understood')` at most once per 10
  minutes per instance (keep a timestamp in module scope).
- `api/_youtubeLive.ts`: export `looksLikeYoutubePage(html): boolean` (contains `ytInitialData` or
  `ytInitialPlayerResponse`), used for the distinction above.
- `src/components/admin/SystemStatus.tsx` already has a YouTube check; make it call `/api/live` and
  `/api/youtube-library` and show the library's `updatedAt` age: warn when older than 3 hours.

### 5. The download services (REL-04)

Only if the owner chose "keep" (OWNER-06). Add to `scripts/smoke-test.mjs` a **non-failing** check (prints `WARN`,
never `FAIL`): `/api/media-link?id=<a channel video id>&kind=listen` answers 200. Record in `docs/RUNBOOK.md` how to
replace a dead service with the `COBALT_INSTANCES`, `INVIDIOUS_INSTANCES`, `PIPED_INSTANCES` variables in Vercel.
If the owner chose "remove": stop and write that in `STATE.md`; removal is its own task, not part of this package.

## Tests

- `api/youtube-library.test.ts`: a playlist the channel page lists first comes first in the answer.
- `api/youtube-shorts.test.ts`: no request to `/feeds/`; an empty page returns the last good answer and logs once.
- `api/_youtubeLive.test.ts`: `looksLikeYoutubePage` true for a page with player data, false for a consent or error page.
- `api/live.test.ts`: a page that is not a YouTube page logs a warning once across two calls.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
grep -rn "feeds/videos.xml" api scripts --include=*.ts --include=*.mjs | grep -v "\.test\." | grep -v "sync-youtube.mjs"   # must print nothing
```

## Done when

- [ ] Every playlist is newest-first and the playlists follow the channel's order.
- [ ] The grep prints nothing.
