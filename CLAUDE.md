# موقع الشيخ أشرف مازن (Ashraf Mazen website)

Arabic RTL site: video / audio / written lessons, a PDF book library, visitor suggestions, a full admin panel.
React 19 + Vite + Tailwind 4 · Supabase (Postgres + Auth) · Cloudflare R2 (all files) · Vercel functions in `api/`.
No visitor accounts. Visitors send requests via `api/submit`; nothing changes until an admin approves it.

## How to work here (keep the context small)

- **Never read whole big files.** Use the map below, then `grep -n` and read only the line range you need.
- **Never open** (generated or heavy, no logic): `dist/`, `node_modules/`, `.taste-skill/`, `.impeccable/`, `src/data/**`
  (bundled YouTube library, regenerate with `npm run sync:youtube && npm run build:library`), `public/sitemap.xml`,
  `package-lock.json`, `docs/audit/00-02*`, `*.rar`, `bun.lock`. `.claude/settings.json` blocks reading them.
- **File size rule: under ~350 lines.** When a file grows past that, split it (extract a component, a hook, or a data module)
  before adding more. One topic per file. No data access inside JSX; no business rules inside components.
- Edit with small targeted edits; do not rewrite a file to change a few lines. Do not re-read a file you just edited.
- Run `npm run typecheck` once when the edit batch is done (not after each edit); `npm run check` before pushing.
- Batch independent tool calls in one turn. Prefer text tools (grep, javascript_exec) over screenshots.
- Replies: short, Egyptian Arabic, what changed / what is left / what the user must do.
- Never write secrets anywhere. Server keys (`SUPABASE_SERVICE_ROLE_KEY`, R2 keys) live only in Vercel env vars and `.env.local`.

## Commands

`npm run dev` (port 3000, also serves `api/`) · `typecheck` · `check` (types + build) · `health` (database permissions + R2) ·
`smoke <url>` (every page and function) · `sitemap` · `sync:youtube` / `build:library`.

Admin screens without a login: run `npm run dev`, open `/dev/admin` (fake in-memory database and fake storage, dev only).

## Map

```
api/            Vercel functions: submit.ts (visitor requests), r2.ts + _r2.ts (file links/upload/delete), youtube-library.ts
                imports inside api/ need the ".js" extension (Node on Vercel)
src/services/   dataService.ts = barrel. Real code in data/: shared(types, slugify) extras catalog lessons catalogAdmin
                lessonsAdmin audio books youtube submissions auth settings social
                analytics.ts (views, watch time) · r2.ts (upload/delete in browser) · bookmarkService · progressService
src/pages/      One file per route. Big pages keep their parts in a folder beside them:
                lesson/ (useLessonData, ChapterList, ReadingNow, AutoNextBanner, LessonNav, SeriesLessonsList, seo)
                home/ (Panel, LessonRow, ContentKinds, FeaturedCard, ContinueCard)
                admin/AdminDashboard.tsx + admin/dashboard/ (AdminHeader, LessonsTab, SeriesTab, CategoriesTab,
                ChangePasswordModal, types) · admin/AdminLogin · AdminResetPassword · AdminPage (auth gate)
src/components/ shared UI. admin/: modals/ (Category, Series, Lesson, DeleteConfirm), branding/ (BannerSettings, SocialLinks),
                BooksManager, SubmissionsManager, YoutubeManager, StatsPanel, SystemStatus
src/lib/        supabase client, youtube helpers, youtubeLibrary (bundled + live + admin overrides)
src/utils/      helpers (Arabic numbers/dates, category colors, normalizeArabic), chapters, supabaseErrors
src/dev/        AdminHarness (fake data for /dev/admin)
docs/           migrations/ (run in order, see its README), TROUBLESHOOTING.md, audit/03-logic-review.md (open issues)
```

## Where to change what

| Task | Files |
|---|---|
| A rule about lessons / series / categories | `services/data/lessons*.ts`, `catalog*.ts`; forms in `components/admin/modals/` |
| Visitor request flow | `api/submit.ts`, `pages/Contribute.tsx`, `services/data/submissions.ts`, `admin/SubmissionsManager.tsx` |
| Views / watch time | `services/analytics.ts`, `docs/migrations/2026-11-04-analytics.sql`, players call `trackView/createPlaybackMeter` |
| Books | `services/data/books.ts`, `admin/BooksManager.tsx`, `pages/BooksLibrary.tsx`, `BookView.tsx` |
| Files on R2 | `api/r2.ts`, `api/_r2.ts`, `services/r2.ts` (upload), cleanup in `services/data/*Admin.ts` and `books.ts` |
| Search | `services/data/lessons.ts` (`searchLessons`), `components/SiteSearchExtras.tsx`, `utils/helpers.ts` (`normalizeArabic`) |
| Permissions (who can read/write) | `docs/migrations/2026-11-05-security.sql` — change the SQL, run it in Supabase, then `npm run health` |

## Deploy

GitHub repo `Moazenaba/AshrafMazen-Wepsite` → Vercel project `ashraf-mazen-wepsite` (production = `main`).
Work on a branch, push, the owner merges the pull request. Database changes are SQL files the owner runs in the Supabase SQL editor.
