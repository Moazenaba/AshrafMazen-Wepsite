# Implementation changelog

## 2026-11-24 — domain move (commit `bb2924c`, deployed)

`https://ashrafmazen.com` in `index.html`, `useCanonical.ts`, `site-data.mjs`, `api/sitemap-videos.ts`, `check-content-changed.mjs`, `llms.txt`, robots, `vercel.json` redirect, R2 CORS lists (`scripts/r2-setup.ts`, `docs/r2-cors.json`), CSP hash of the changed inline JSON-LD.

## 2026-11-24 — SEO engineering pass (not committed)

| Stage | Change | Files |
|---|---|---|
| Technical | `/path/` → 308 `/path` | `vercel.json` (`trailingSlash: false`) |
| Technical | `/search`, `/contribute` noindex,follow (prerender + app); `/bookmarks`, `/admin`, `/dev` noindex in the app | `scripts/prerender.mjs`, `scripts/prerenderParts.mjs` (`robots`), `src/hooks/useCanonical.ts` (`robotsFor`) |
| Technical | prerendered `/reels`, `/live`, `/search`, `/contribute` with their own titles | `scripts/prerender.mjs` |
| Metadata | hashtag tails removed from video titles in `<title>`, `h1`, JSON-LD, both video sitemaps, llms.txt and the app's own page title | `src/lib/seoText.ts`, `src/lib/pageMeta.ts`, `src/pages/VideoView.tsx`, `api/_sitemapVideos.ts` |
| Metadata | clearer titles/descriptions for `/videos`, `/audio`, `/books`, `/quran`, playlists | `scripts/prerender.mjs` |
| Metadata | default share image 1200×630 on pages without their own | `public/og-image.png`, `scripts/make-og-image.mjs` (`npm run og-image`) |
| Structured data | one `@graph` per page; shared WebSite + Person by `@id`; WebPage/CollectionPage/ItemPage; Article for lessons with text; Book linked to the person; VideoObject only with a real date | `scripts/seoSchema.mjs`, `scripts/prerender.mjs` (the shell's static JSON-LD is removed from built pages) |
| Internal links | nav adds Reels and Quran; home lists playlists with counts and latest videos; each video links to previous/next | `scripts/prerender.mjs` |
| Sitemap | `lastmod` from real dates for home, libraries, categories, series; `/reels` added; clean titles + descriptions in video entries; robots lists both sitemaps | `scripts/generate-sitemap.mjs` |
| AI search | `llms.txt` generated from the data | `scripts/llms.mjs` |
| Testing | build audit + live audit, unit tests, wired into `npm run check` and CI | `scripts/seo-audit.mjs`, `scripts/seoAuditRules.mjs`, `scripts/seo-live.mjs`, `*.test.*`, `package.json`, `.github/workflows/ci.yml` |
| Docs | this folder | `docs/seo/` |

## 2026-11-25 — let Google render pages with their data

Search Console URL Inspection of `/reels` showed 5 of 36 resources blocked by robots.txt (`/api/site`, `/api/live`, `/api/youtube-library`, `/api/youtube-shorts`) and the rendered page empty. `Disallow: /api/` removed from robots.txt (`scripts/generate-sitemap.mjs`); every `/api/*` answer now sends `X-Robots-Tag: noindex` (`vercel.json`) so the JSON is fetched for rendering but never indexed; `seo-audit` fails if robots.txt blocks `/api/`, `/assets/` or `/fonts/`.

Not changed: visible titles in the app (except the browser tab title of a video), routes, admin, uploads, playback, APIs, the CSP.

## 2026-11-25 — the home page is the page for the name

Name searches were landing on `/reels`, `/videos` or `/audio`. Home is now a `ProfilePage` whose `mainEntity` is the site Person (`scripts/seoSchema.mjs`, `scripts/prerender.mjs`); the prerendered nav links to `/` with the text «الشيخ أشرف مازن» instead of «الرئيسية», and the app's logo link is named the same (`src/components/Navbar.tsx`); `/videos` and `/audio` titles put the topic first and the name last. `seo-audit` fails if home is not that ProfilePage.
