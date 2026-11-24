# AI search readiness (AI Overviews, AI Mode, Copilot, ChatGPT search, Perplexity)

These systems rely on the same foundations as normal search: crawlable HTML, clear entities, accurate text and links. There is no separate "AI ranking" switch.

| Signal | State | Evidence |
|---|---|---|
| Crawlable without JavaScript | yes: every public page prerendered with text and links in `#root` | `dist/*/index.html`, `seo-audit` (h1 check) |
| Crawler access | `robots.txt` is `User-agent: * / Allow: /` with 3 private disallows (`/admin`, `/bookmarks`, `/dev/`). No AI crawler (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Bingbot, CCBot) is blocked | `public/robots.txt` (generated) |
| Cloudflare bot blocking | none in the path: the domain is DNS only (grey cloud), so Cloudflare's "Block AI bots" / Bot Fight Mode do not apply | DNS answers are Vercel IPs |
| Entity clarity | one Person + WebSite graph on every page, sameAs to real profiles | ENTITY-ARCHITECTURE.md |
| Descriptive headings | `h1` = the page subject; `h2` per section | prerender |
| Source attribution | each page has one canonical URL to cite | `seo-audit` |
| llms.txt | generated at build from the data: sections, the 14 channel series with links, categories, site series, sitemaps | `scripts/llms.mjs` → `/llms.txt` |

`llms.txt` is a convenience for assistants that read it; it is not a ranking mechanism and no major engine has said it uses it.

## Choice left to the owner

`Google-Extended` (Gemini training, not Search) and `GPTBot` (OpenAI training, not ChatGPT search) are allowed today. Blocking them would not affect Google Search or ChatGPT search results. If the sheikh prefers his lessons not be used for training, add to `generate-sitemap.mjs`:
```
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /
```
Do **not** block `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Bingbot` or `Googlebot`: those are the search fetchers.

## What helps most from here

Real written text (transcripts, a short approved biography) — AI answers quote text, and video pages today have only titles.
