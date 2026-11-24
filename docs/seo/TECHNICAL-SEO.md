# Technical SEO

## URL rules

| Rule | How it is enforced | Check |
|---|---|---|
| One host: `https://ashrafmazen.com` | Vercel domains: `www` → apex (308); `ashraf-mazen.vercel.app` and `ashraf-mazen-wepsite.vercel.app` → apex, same path and query (308, one hop) | `npm run seo:live` |
| No trailing slash | `vercel.json` `"trailingSlash": false` (308 to the slash-less URL) | `npm run seo:live` (`/videos/`) |
| Canonical = the page's own URL, no query | prerender writes it; the app's `useCanonical` sets it for pages added after a deploy | `npm run seo:audit` |
| Query strings (`?t=`, `?list=`) never create a new canonical | canonical ignores the query (`canonicalFor`) | `src/hooks/useCanonical.test.ts` |
| Unknown paths | served `app.html` (200, **no** canonical); the app redirects to `/`, whose canonical is `/` | `seo:live` "unknown page" |

Note on unknown paths: a real HTTP 404 would need a server function per request or a list of every valid id at the edge. Today Google renders the page, follows the client redirect to `/` and folds it into the home page, so no junk URL gets its own index entry. Revisit only if Search Console shows "Soft 404" in volume.

## Indexing directives

| Path | robots | Where |
|---|---|---|
| All content pages | `index, follow, max-image-preview:large` | `index.html` shell |
| `/search`, `/contribute` | `noindex, follow` | prerender (`robots:`) + `robotsFor` in `src/hooks/useCanonical.ts` |
| `/bookmarks`, `/admin`, `/dev`, `/api/` | `Disallow` in robots.txt; `noindex` in the app | `scripts/generate-sitemap.mjs`, `robotsFor` |

## Prerendered pages (408 in the current build)

`/`, `/videos`, `/audio`, `/books`, `/reels`, `/live`, `/quran`, `/search`, `/contribute`, 6 categories, 3 series, 2 lessons, 14 playlists, 375 videos (a video in several playlists gets one page; a video that is also a lesson is only the lesson). Each has its own title, description, canonical, og/twitter tags, one JSON-LD graph, `<h1>` and text with links inside `#root`.

## Sitemaps

| File | Built by | Contents |
|---|---|---|
| `/sitemap.xml` | `scripts/generate-sitemap.mjs` at build | 405 canonical URLs; `lastmod` only from real dates (newest lesson in a list, video `published`); `<video:video>` with clean title, description, thumbnail, player URL, date when known |
| `/sitemap-videos.xml` | `api/sitemap-videos.ts` (live, CDN-cached) | every channel video and playlist, including ones added after the last build |
| `/robots.txt` | same generator | `Allow: /`, the four disallows, both sitemaps |

Both sitemaps list channel videos; that overlap is allowed and lets videos found after a deploy be discovered before the next build.

## Performance (observed, not changed here)

Already in place: self-hosted woff2 fonts with `font-display: swap` and preload (`index.html`), immutable caching of `/assets` and `/fonts` (`vercel.json`), a CDN-cached `/api/site` preloaded in parallel with the scripts, first-visit data seeded into the home page (`withSiteSeed`), a bundle-size check in CI (`scripts/check-bundle-size.mjs`), Vercel Speed Insights. YouTube is embedded through `youtube-nocookie.com` on demand.
Not measured in this pass: field Core Web Vitals. Use PageSpeed Insights / Search Console → Core Web Vitals after a few weeks of traffic; act on what it shows rather than guessing.

## Security headers and crawling

The CSP (`vercel.json`) is unchanged in this pass except where the domain move changed the inline JSON-LD hash (`csp.test.ts` checks it). JSON-LD and the site seed are data blocks (`type="application/ld+json"` / `application/json`), which CSP does not execute, so per-page JSON-LD needs no hash. `img-src https:` allows the YouTube thumbnails and the share image; nothing in the headers blocks crawlers. `X-Frame-Options: SAMEORIGIN` only affects framing, not indexing.
