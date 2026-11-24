# SEO test report

## Automated

| Check | Tool | Where it runs |
|---|---|---|
| Canonical on the domain and = the page itself; og:url matches | `scripts/seo-audit.mjs` (`auditPage`) | `npm run check`, CI |
| Unique titles (duplicates listed), title length, description present and not short | seo-audit | same |
| No accidental noindex; search/contribute are noindex | seo-audit + `src/hooks/useCanonical.test.ts` | same + `npm test` |
| Arabic `lang="ar" dir="rtl"`, UTF-8 | seo-audit | |
| Prerendered `h1` text inside `#root` | seo-audit | |
| JSON-LD: valid JSON, one graph, WebSite + Person present, unique @ids, no vercel.app URL, VideoObject has name/description/thumbnail/valid uploadDate, breadcrumbs numbered on the site, Article headline ≤ 110 | seo-audit | |
| Internal links lead to a prerendered page or a dynamic route | seo-audit | |
| Sitemap: urlset, no duplicates, only the domain, no trailing slash, no noindex page, lastmod YYYY-MM-DD, each URL prerendered | seo-audit (`auditSite`) | |
| robots names both sitemaps, never `Disallow: /`; llms.txt present; app.html has no canonical | seo-audit | |
| Rules of the audit itself | `scripts/seoAuditRules.test.mjs` (7 tests) | `npm test` |
| Title cleaning, names, descriptions | `src/lib/seoText.test.ts` | `npm test` |
| robots rule, domain constant | `src/hooks/useCanonical.test.ts` | `npm test` |
| Per-page robots in the renderer, llms.txt content | `scripts/prerender.test.mjs` | `npm test` |
| Legacy + www redirects (one 308, same path + query), trailing slash, robots/sitemaps status and type, sample of sitemap pages 200 + self canonical + no noindex, unknown page has no canonical | `scripts/seo-live.mjs` (`npm run seo:live`) | by hand after a deploy (read-only GETs) |

In CI the build has no database, so prerender is skipped; the audit then checks only the shell, robots and sitemap.

## Results (2026-11-24)

- `npm run typecheck`: pass. `npm test`: **102 files, 538 tests passed**, 1 skipped (pre-existing).
- `npm run build` + `node scripts/seo-audit.mjs`: **408 pages, 405 sitemap URLs, 0 errors**, 155 warnings:
  149 titles over 70 characters (real lesson titles, kept), 5 category/series descriptions under 40 characters, 1 duplicate title («دعائم منهاج النبوة» playlists).
- `node scripts/seo-live.mjs --sample 15` against production **before** this change: all passed except `/videos/` → 200 (fixed by `trailingSlash`, effective after deploy).

## Manual checks after deploy

1. `npm run seo:live -- --sample 40` → ALL PASSED.
2. [Rich Results Test](https://search.google.com/test/rich-results): `/`, one `/video/{id}` with a date, one `/lesson/{id}` → Breadcrumbs + Video detected, no errors.
3. [validator.schema.org](https://validator.schema.org/): same URLs → no errors.
4. [PageSpeed Insights](https://pagespeed.web.dev/): `/` and one video page, mobile → note LCP/CLS/INP.
5. Share `https://ashrafmazen.com/` in WhatsApp/Facebook → the green card image shows.
6. Search Console → URL Inspection → `/` → "URL is on Google" after indexing.
