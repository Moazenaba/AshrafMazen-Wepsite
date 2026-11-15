# Problems: security

Audit date: 2026-11-15, commit `2ead989` (main). Severity: **H** = fix before selling, **M** = fix soon, **L** = hygiene.
Every problem has an ID used by the work packages (`../wp/`). "Evidence" says how it was established.

`npm audit --omit=dev` reports **0 vulnerabilities**. No `dangerouslySetInnerHTML`, `innerHTML =`, `eval` or
`new Function` anywhere in `src/` or `api/`. Row-level security is on for all six core tables
(`docs/migrations/2026-11-05-security.sql`), and `save_setting_if_unchanged` is deployed (probed: answers "admins only").

| ID | Sev | Problem | Where | Evidence | Fixed by |
|---|---|---|---|---|---|
| SEC-01 | H | `/api/media-link` has no rate limit. Each call may run up to 60 s and calls 4 outside services. Anyone can loop it with a valid channel video id and burn the plan's function time (denial of service by cost). | `api/media-link.ts` (handler), `vercel.json` `maxDuration: 60` | Read the handler: no per-address limit, `Cache-Control: no-store`. | WP-01 |
| SEC-02 | M | `/api/media-link` probes (`works()`) whatever URL an outside service returns. A hostile or hijacked instance could point it at an internal or non-https address. | `api/media-link.ts` `works()`, `api/_providers.ts` parsers | Read the code: the URL is only checked to be a string. | WP-01 |
| SEC-03 | M | Admin delete on `/api/r2` accepts **any** key in the bucket: `keyFromLink` has no folder check, unlike the public GET which allows only site folders. A stolen admin session can wipe the bucket. | `api/r2.ts` `remove()`, `api/_r2.ts` `keyFromLink` | Read the code. | WP-01 |
| SEC-04 | M | A signed upload link has no size or type limit on the storage side: the 5-8-200-500 MB limits are checked only against the size the browser *claims*. | `api/r2.ts` `sign()` (`body.size`), `api/_r2.ts` `presign()` (`SignedHeaders=host`, `UNSIGNED-PAYLOAD`) | Read the code. | WP-01 |
| SEC-05 | M | The Content-Security-Policy does not list hosts the site now uses: the public bucket (`https://pub-….r2.dev`) is missing from `connect-src` (a `fetch()` to it is blocked: seen live as "Failed to fetch"), and the Quran page will need `https://www.mp3quran.net`, `https://api-staging.mp3quran.net`. There is also no `report-uri`, so violations are invisible. | `vercel.json` headers, `src/test/csp.test.ts` | Printed the header; reproduced the blocked fetch on the live site. | WP-01 |
| SEC-06 | L | Three admin links open a new tab without `rel="noopener noreferrer"`. | `src/pages/admin/dashboard/CategoriesTab.tsx`, `LessonsTab.tsx`, `SeriesTab.tsx` | Scripted scan of every `target="_blank"` with 4 lines of context. | WP-01 |
| SEC-07 | M | The visitor form's rate limit (5 per hour per address) lives in each server instance's memory, and the Turnstile bot check is off unless `TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY` are set. Real cap: 500 pending rows (database trigger). | `api/submit.ts` `tooMany()`, `recent` map | Read the code; documented as a known limit in `docs/PRODUCTION.md`. | WP-01 (code), OWNER-04 (keys) |
| SEC-08 | M | `record_event` and `ping_visitor` are open to everyone with no request limit: views and watch time can be inflated at will. | `docs/migrations/2026-11-04-analytics.sql` | Read the SQL (only a 600 s cap per call). | WP-05 (limit in SQL) |
| SEC-09 | H | Secrets that were pasted in old conversations (database password, R2 keys, a `cfat_` token) are listed as "rotate" and nothing in the repo shows it was done. | `docs/PRODUCTION.md`, `docs/REVIEW-ME.md` | Read the docs. Cannot be verified from code. | OWNER-01 |
| SEC-10 | M | One admin password protects everything; there is no second factor and the Vercel account itself shows "Enable 2FA". | Supabase Auth settings, Vercel account | Seen in the Vercel dashboard banner. | OWNER-02 |
| SEC-11 | L | The bucket is now public by address. Draft material (unpublished lesson audio, draft book files outside `library/files/`) is reachable by anyone who learns its address (addresses are random UUIDs, so guessing is impractical, but a shared link stays valid forever). | Cloudflare R2 public access, `api/r2.ts` 308 redirect | Verified live: public address answers without a signature. | WP-04 (document + keep PDFs private), owner decision |
| SEC-12 | L | `checkCurrentAdmin` and `login` log full Supabase error objects to the browser console; `api/submit` logs the first 300 chars of the database's answer. No secrets seen in them, but they are unreviewed. | `src/services/data/auth.ts`, `api/submit.ts` | Read the code. | WP-05 (log hygiene rule) |

## What was checked and found sound

- Visitors cannot write to any table; drafts are admin-only; `published_books()` hides draft books.
- `/api/r2` GET serves only `library/files|covers`, `audio`, `branding`, `media/video`, rejects `..`.
- `/api/submit`: size limits, http(s)-only links, honeypot, minimum form time, database trigger repeats the checks.
- Inline script allowed only by hash, with a test that fails when the script changes (`src/test/csp.test.ts`).
- HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` are set for every path.
- Telegram links are accepted only for Telegram hosts; a live broadcast shows only for the Sheikh's own channel id.
