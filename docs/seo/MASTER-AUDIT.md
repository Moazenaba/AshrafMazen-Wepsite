# SEO master audit — ashrafmazen.com

Date: 2026-11-24. Evidence: repository at `latest/` (branch `main`), the build in `dist/`, and read-only requests to the live site.
Every finding below names the file or URL it came from. Nothing here is a ranking promise.

## Architecture (verified)

| Part | What it is | Where |
|---|---|---|
| App | React 19 single-page app, Vite 8, React Router 7 | `src/main.tsx`, `src/routes/AppRoutes.tsx` |
| Rendering | Static prerender after `vite build`: one real HTML file per public URL with its own head, JSON-LD and text | `scripts/prerender.mjs`, `scripts/prerenderParts.mjs` |
| Fallback | `dist/app.html` (no canonical) for pages added after a deploy; the app sets canonical + robots | `vercel.json` rewrite, `src/hooks/useCanonical.ts` |
| Data | Supabase (categories, series, lessons, books, social links, settings) + bundled YouTube library (14 playlists, 375 videos) | `scripts/site-data.mjs`, `src/data/youtube-library.ts` |
| Sitemaps | `sitemap.xml` written at build; `sitemap-videos.xml` served live by a function | `scripts/generate-sitemap.mjs`, `api/sitemap-videos.ts` |
| Hosting | Vercel project `ashraf-mazen`; DNS on Cloudflare, DNS only (Vercel IPs 216.198.79.65 / 64.29.17.65) | `nslookup`, response header `Server: Vercel` |
| Files | Cloudflare R2 (audio, PDFs, images) | `api/r2.ts`, `src/services/r2.ts` |

## Baseline (before this work)

| # | Finding | Severity | Evidence |
|---|---|---|---|
| B1 | Canonical, sitemap, schema, robots and llms.txt all on `ashraf-mazen.vercel.app` | Critical | fixed in commit `bb2924c` (domain move) |
| B2 | Two JSON-LD blocks per page: the shell's `WebSite+Person` and the page's own `Person` with the same `@id` but different fields | High | `index.html` static block + `prerender.mjs` home `person` |
| B3 | 279 of 376 channel video titles end in hashtag tails (`#الشيخ_أشرف_مازن`, `/# لفضيلة الشيخ أشرف -مازن`) used verbatim as `<title>`, `h1`, VideoObject name and video sitemap title | High | `src/data/youtube-library.ts`, `dist/video/*/index.html` |
| B4 | No share image on pages without a video (`og:image` missing on home, libraries, categories) | Medium | `dist/index.html` |
| B5 | `/videos/` answered 200 (duplicate of `/videos`) | Medium | `curl https://ashrafmazen.com/videos/` → 200 |
| B6 | `/search`, `/contribute`, `/bookmarks` indexable (no robots rule); `/reels`, `/live`, `/search`, `/contribute` not prerendered (generic home title) | Medium | live HTML of `/search` |
| B7 | `robots.txt` lost its `sitemap-videos.xml` line on every build | Medium | `scripts/generate-sitemap.mjs` wrote one line only |
| B8 | `lastmod` missing on home, libraries, categories, series | Low | `public/sitemap.xml` |
| B9 | `llms.txt` hand-written: listed 5 sections, none of the 14 series | Low | `public/llms.txt` |
| B10 | No automated check of the built pages (canonical, titles, JSON-LD, sitemap) | Medium | `scripts/` had only unit tests of `render` |

Verified correct at baseline: Arabic `lang="ar" dir="rtl"`, UTF-8, unique canonical per prerendered page, legacy domains and `www` → one 308 hop to the same path on `ashrafmazen.com`, robots allows all crawlers (no AI crawler blocked), CSP allows images from `https:` and the YouTube embed.

## Content findings that need the owner (not code)

| Finding | Where | Why it matters |
|---|---|---|
| A test series named **`tessst`** is published | `/series/tessst` (in the sitemap and indexable) | Junk page indexed under the sheikh's name. Unpublish or delete it in the admin. |
| Two categories look like one: **«المصطلح»** (`/category/mustalah`) and **«مصطلح الحديث»** (`/category/مصطلح-الحديث`) | admin → categories | Two thin pages competing for the same query. Merge into one. |
| Two YouTube playlists are both titled **«دعائم منهاج النبوة»** | `/playlist/PLHcd1VuAeT_OW6FmnOfwQzbZvEOQed3yB`, `/playlist/PLHcd1VuAeT_PiOe9ozUxHwjOKDruxtlnD` | Same title on two pages. Rename one on YouTube (e.g. add the part number) or merge. |
| Only 2 published lessons on the site; 0 books | Supabase | Almost all depth is in channel videos, which have no text beyond a title. Written transcripts are the biggest content lever. |
| 229 of 375 channel videos have no known upload date | `src/data/youtube-library.ts` (`published` on 146) | Without a date no `VideoObject` is written (Google requires `uploadDate`), so those pages are not eligible for video results. |

## What was changed (summary — details in IMPLEMENTATION-CHANGELOG.md)

B2 → one `@graph` per page (`scripts/seoSchema.mjs`). B3 → `cleanVideoTitle` (`src/lib/seoText.ts`) everywhere search engines read titles. B4 → `public/og-image.png`. B5 → `"trailingSlash": false`. B6 → prerendered `/reels`, `/live`, `/search` (noindex), `/contribute` (noindex) + `robotsFor` in the app. B7–B9 → generator fixed, `llms.txt` generated. B10 → `scripts/seo-audit.mjs` (build) and `scripts/seo-live.mjs` (production), in `npm run check` and CI.

## Result after the change (local build)

`node scripts/seo-audit.mjs`: **408 pages, 405 sitemap URLs, 0 errors**, 155 warnings (titles over 70 characters that are the videos' real names, 5 short category descriptions, 1 duplicate title — the playlist above). See SEO-TEST-REPORT.md.
