# External configuration checklist

Status column: **verified** = checked by a request during this work; **to do** = needs the owner's access; nothing is marked done without a check.

## A. Repository (done in code, ships on the next deploy)

Domain everywhere, one JSON-LD graph, clean video titles, og-image, trailing-slash redirect, noindex for search/contribute, sitemap lastmod, robots with both sitemaps, generated llms.txt, `seo:audit` + `seo:live`. See IMPLEMENTATION-CHANGELOG.md.

## B. Vercel (project `ashraf-mazen`)

| Item | Status |
|---|---|
| `ashrafmazen.com` serves the site; `www` → apex 308 | verified 2026-11-24 |
| `ashraf-mazen.vercel.app` → `https://ashrafmazen.com` same path 308 | verified |
| `SITE_URL` | verified indirectly: the deployed canonicals are on the new domain. If it is set, it must be `https://ashrafmazen.com` |
| `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` | to do only if you verify with an HTML tag instead of DNS (then redeploy) |

## C. Cloudflare

| Item | Status | Steps |
|---|---|---|
| DNS records DNS only (grey) | verified (answers are Vercel IPs) | keep grey; orange would put Cloudflare in front of Vercel's SSL and cache |
| R2 bucket CORS lists the new domain | **to do — uploads from the admin on ashrafmazen.com fail until done** | R2 → `sheikh-ashraf-mazen` → Settings → CORS Policy → Edit → paste `docs/r2-cors.json` → Save |
| Google verification TXT | to do | DNS → Add record → TXT, name `@`, value from Search Console |

## D. Google Search Console

1. Add property → **Domain** → `ashrafmazen.com` → add the TXT in Cloudflare → Verify.
2. Sitemaps → submit `https://ashrafmazen.com/sitemap.xml` and `https://ashrafmazen.com/sitemap-videos.xml`.
3. URL Inspection → `/`, `/videos`, `/audio` → Request indexing.
4. If a property for `https://ashraf-mazen.vercel.app/` exists: Settings → **Change of address** → `ashrafmazen.com`.
5. After 4–6 weeks: Performance report → the monthly process in ARABIC-NAME-VARIATIONS.md §D; Pages report → fix any "Duplicate, Google chose different canonical" or "Soft 404"; Videos report → which videos are indexed.

## E. Bing Webmaster Tools

Sign in → **Import from Google Search Console** (verifies and copies the sitemaps). Bing feeds Copilot and DuckDuckGo.

## F. Official accounts (owner / the sheikh)

| Account | Action |
|---|---|
| YouTube | Studio → Settings → Channel → Advanced → **Associated website** = `https://ashrafmazen.com` (needs Search Console verification first); channel → Customize → Links → add the site |
| YouTube playlists | rename one of the two «دعائم منهاج النبوة» playlists; add a short description to each playlist |
| Facebook, Telegram, TikTok | put `https://ashrafmazen.com` in each profile's website/bio field |
| Site admin | unpublish `tessst`; merge «المصطلح» and «مصطلح الحديث»; write 1–2 sentences per category |

These links in both directions (site → profiles via `sameAs`, profiles → site) are what let search engines treat them as one entity.
