# What only the owner can do

A model cannot do these: they need your accounts, your money, or your decision. Each one closes problems that no
code change can close. Tick the box in `STATE.md` when done; the executor never touches this list.

| ID | Do this | Why (problems closed) | Where |
|---|---|---|---|
| OWNER-01 | Rotate every secret that was ever pasted in a chat: the Supabase database password, the Supabase service role key, the R2 access key and secret, any `cfat_` Cloudflare token. Then update them in Vercel (Environment Variables) and redeploy. | SEC-09 | Supabase > Settings > Database / API; Cloudflare > R2 > Manage API tokens; Vercel > project `ashraf-mazen` > Environment Variables |
| OWNER-02 | Turn on two-factor sign-in for the Vercel account, the GitHub account, the Cloudflare account, and add a second factor for the admin user in Supabase Auth. | SEC-10 | each account's security page |
| OWNER-03 | Give the bucket a custom domain (for example `files.<your-domain>`) and tell the executor the address, so `R2_PUBLIC_URL` and `VITE_R2_PUBLIC_URL` stop using the rate-limited `r2.dev` address. Requires a domain managed in Cloudflare. | REL-08 | Cloudflare > R2 > bucket > Settings > Custom Domains |
| OWNER-04 | Create a Cloudflare Turnstile site and put `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel. The code is already there and switches on by itself. | SEC-07 | Cloudflare > Turnstile |
| OWNER-05 | Decide the plans. Selling the site, or running it for a paying customer, is not allowed on Vercel Hobby. Vercel Pro also gives 30 days of logs, log drains, and deploys by other authors. A paid Supabase plan stops the weekly pause and adds daily backups with point-in-time restore. | REL-13, OBS-02, OPS-02, OPS-06 | Vercel > Billing; Supabase > Billing |
| OWNER-06 | Decide whether the "listen / download a channel video" feature stays. It relies on outside volunteer services and on downloading from YouTube, which YouTube's terms restrict. Keeping it is a legal and reliability decision, not a technical one. | REL-04 | tell the executor: keep / remove |
| OWNER-07 | Confirm backups: in Supabase open Database > Backups and check a backup exists; once, restore one into a scratch project to prove it works. Without this, one bad save can lose the site's content for good. | DAT-03 | Supabase > Database > Backups |
| OWNER-08 | Delete the leftovers by hand: `AshrafMazen-Wepsite-main.rar`, `bun.lock`, and the old copy of the project next to this clone (`AshrafMazen-Wepsite-main/`). | OPS-05 | your file manager |
| OWNER-09 | Run each new SQL file the executor writes in `docs/migrations/` (it will say which, in `STATE.md`), in Supabase > SQL Editor, then run `npm run health`. The executor cannot run SQL on your database. | WP-05, WP-15 | Supabase > SQL Editor |
| OWNER-10 | Merge the executor's work. It works on local branches `prod/wp-NN-…`, collects the finished ones in `prod/integration`, and never pushes or touches `main` (a push to `main` deploys to visitors). When you are happy with `STATE.md`, tell it to push `prod/integration`, review, then merge on GitHub; Vercel deploys by itself. | all work packages | GitHub > Pull requests |
| OWNER-11 | In the admin: the home hero card still has a video link of another channel (a Makkah live stream) and is switched off; the welcome sound still holds a 23-minute lesson (it no longer plays, and after `feat/delete-welcome-sound` is merged it can be deleted from the screen). Fix both when convenient. | content, not code | admin > الواجهة والتواصل |

## Decisions the executor must not make for you

- Adding visitor accounts (open item 5/42 of `docs/audit/03-logic-review.md`).
- Removing a feature (OWNER-06).
- Any change of plan, domain, or price.
- Anything that deletes real content from the database or the bucket.
