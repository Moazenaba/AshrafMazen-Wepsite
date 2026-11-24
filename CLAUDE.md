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
- Run `npm run typecheck` once when the edit batch is done (not after each edit); `npm run check` (types + tests + build) before pushing.
- **Tests** (`npm test`, Vitest, no browser/database/network): pure rules and the `api/` functions, next to the code as `*.test.ts`
  (lessonForm, placeLessons, latestFeed, relations, chapters, arabic helpers, youtube links, viewCounter, api/submit). When a rule changes,
  change its test first. New logic goes in a plain function so it can be tested; builders for test data are in `src/test/factories.ts`.
- Batch independent tool calls in one turn. Prefer text tools (grep, javascript_exec) over screenshots.
- Replies: short, Egyptian Arabic, what changed / what is left / what the user must do.
- Never write secrets anywhere. Server keys (`SUPABASE_SERVICE_ROLE_KEY`, R2 keys) live only in Vercel env vars and `.env.local`.

## Commands

`npm run dev` (port 3000, also serves `api/`) · `typecheck` · `test` · `check` (types + tests + build) · `health` (database permissions + R2) ·
`smoke <url>` (every page and function) · `sitemap` · `refresh:youtube` / `build:library`.

**YouTube library:** new channel videos are added to `src/data/youtube-library.ts` automatically by `.github/workflows/sync-youtube.yml`
(every 30 minutes, or on a `repository_dispatch` event `youtube-upload`); it commits as the owner so Vercel deploys. The old `sync:youtube`
script reads RSS feeds that YouTube now answers with 404, so do not use it. Run `npm run refresh:youtube -- --dry` to see what is new.

**Live broadcast:** the banner and `/live` show the Sheikh's own YouTube live automatically: `api/live.ts` asks YouTube once a minute
(CDN-cached) whether the channel `YOUTUBE_CHANNEL_ID` is live, and a live of any other channel can never show (`api/_youtubeLive.ts` checks the
channel id). The admin only controls Telegram (a manual switch + link in "الواجهة والتواصل"); there is no manual YouTube link.

**SEO:** `npm run build` = sitemap → vite build → `scripts/prerender.mjs`, which writes a real HTML page per public URL into
`dist/` (own title, description, canonical, schema.org, text with links; data from `scripts/site-data.mjs`). Pages added after
a deploy fall back to `dist/app.html` (no canonical) and `useCanonical` sets it. The one public domain is `https://ashrafmazen.com`;
`www.ashrafmazen.com` and the `*.vercel.app` addresses redirect to it (Vercel domains + `vercel.json`); DNS is on Cloudflare, DNS only (grey cloud). Search Console tag: env `GOOGLE_SITE_VERIFICATION` (Vercel), then redeploy.

Admin screens without a login: run `npm run dev`, open `/dev/admin` (fake in-memory database and fake storage, dev only).

## Map

```
api/            Vercel functions: submit.ts (visitor requests), r2.ts + _r2.ts (file links/upload/delete), youtube-library.ts
                imports inside api/ need the ".js" extension (Node on Vercel)
src/App.tsx     the shell only (theme, audio, top bar, footer). hooks/ (useScrollToHash, useScrollReveal, useVersionReload,
                usePageAnalytics) · routes/ (AppRoutes, lazyPages)
src/services/   dataService.ts = barrel over data/: db (rows helper) shared extras catalog relations lessons lessonLists
                lessonSearch portal lessonsAdmin catalogAdmin audio audioUpload books youtube submissions auth settings social
                analytics.ts (views, watch time) · r2.ts (upload/delete in browser) · bookmarkService · progressService
src/pages/      One file per route; a big page keeps its parts in a folder beside it, split as hooks (behaviour) + components (view):
                lesson/ (useLessonData, useLessonTabs, useLessonPlayback, useTranscriptReading, useTranscriptFont, useShare,
                  useLessonSeo, siblings, seo + LessonHeader, LessonMediaPanel, TranscriptPanel, ChapterList, ReadingNow,
                  AutoNextBanner, LessonNav, SeriesLessonsList, LessonStates)
                home/ (useHomeData, placeLessons, latestFeed, sermons, todayLine + HeroSection, FeaturedColumn, SciencesColumn,
                  SideColumn, ChannelPlaylists, AboutSection, Panel, cards)
                admin/AdminDashboard.tsx (composition only) + admin/dashboard/ (hooks/: useAdminData, useEditor, useDeleteConfirm,
                  useSubmissionsBadge, useCategoryActions, useSeriesActions, useLessonActions; AdminHeader, tabs, DataErrorBanner,
                  SystemTab, ChangePasswordModal) · AdminLogin · AdminResetPassword · AdminPage (auth gate)
src/components/ shared UI. admin/: modals/ (Category, Series, DeleteConfirm, Lesson + lesson/ = lessonForm rules, useLessonForm,
                field groups), branding/ (BannerSettings, SocialLinks + their windows), books/ (BookModal), stats/ (useStats, format),
                BooksManager, SubmissionsManager, YoutubeManager, StatsPanel, SystemStatus
src/lib/        supabase client, youtube helpers, youtubeLibrary (bundled + live + admin overrides)
src/utils/      helpers.ts = barrel: arabicNumbers, timeFormat, categoryTheme, arabicSearch; chapters, supabaseErrors
src/dev/        AdminHarness (fake data for /dev/admin)
docs/           migrations/ (run in order, see its README), TROUBLESHOOTING.md, audit/03-logic-review.md (open issues)
```

Design rules used here: one responsibility per file; screens get data and actions from hooks and only render;
rules that must be tested without a screen are plain functions (for example `lessonForm.ts`, `placeLessons.ts`);
a component receives only the props it uses; the same query/attach logic is written once (`db.ts`, `relations.ts`).

## Rules worth knowing

- **A lesson counts as viewed** when the visitor plays its video or audio, or scrolls its transcript once; once per lesson per visit,
  never on just opening the page, never for a draft preview (`pages/lesson/viewCounter.ts`, `useLessonPlayback`, `useTranscriptReading`).
  Channel videos count on play (`VideoView`); a book counts when its page opens (a PDF frame cannot report scrolling).

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

GitHub repo `Moazenaba/AshrafMazen-Wepsite` → Vercel project **`ashraf-mazen`** (dashboard `https://vercel.com/moaz-6856/ashraf-mazen`; production = `main`).
Vercel deploys only commits authored by the owner's GitHub account (`Moazenaba`); any other author shows "Blocked".
Work on a branch, push, the owner merges the pull request. Database changes are SQL files the owner runs in the Supabase SQL editor.
