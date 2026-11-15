# WP-07: no request waits forever, and a failed load says so

Closes: REL-02, REL-10. Needs WP-09 done.

## Steps

### 1. One helper for server functions

Create `api/_fetch.ts`:

```ts
// fetch that gives up after `ms` (default 8000) and never throws for a timeout: it rejects with Error('timeout')
export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response>
```

Implement with `AbortController` + `setTimeout`, clearing the timer in `finally`. Test `api/_fetch.test.ts` with fake
timers: resolves when the answer comes first; rejects with `timeout` when it does not; the timer is cleared.

Replace **every** bare `fetch(` in these files with `fetchWithTimeout(`, with these limits:

| File | Calls | Limit |
|---|---|---|
| `api/_r2.ts` `isAdminToken` | 2 | 6000 |
| `api/r2.ts` `remove`, `status` | 3 | 10000 |
| `api/site.ts` `readSiteData` (it receives `fetcher`; make the default `fetchWithTimeout`) | 5 | 8000 |
| `api/live.ts` | 1 | 8000 |
| `api/youtube-library.ts` `fetchPage`, `loadOverrides` | 2 | 8000 |
| `api/youtube-shorts.ts` | 1 | 8000 |
| `api/submit.ts` (Turnstile check, database insert) | 2 | 8000 |

`api/media-link.ts` already has its own `timed()`; leave it.

In each handler's `catch`, a `timeout` must produce the same degraded answer the function already gives for a
failure (for example `api/live.ts` -> `{ live: false }`), plus one log line (WP-05 defines the format; until then
`console.error('<function>: timeout <url host>')`).

### 2. One helper for the browser

Create `src/lib/timedFetch.ts` with the same signature (default 12000 ms). Use it in:
`src/services/data/siteBundle.ts`, `src/lib/youtubeLibrary.ts`, `src/lib/reels.ts`, `src/hooks/useLiveStream.ts`,
`src/pages/Contribute.tsx`, `src/services/r2.ts` (the sign and delete calls, **not** the file upload `XMLHttpRequest`),
`src/components/admin/SystemStatus.tsx`, `src/components/admin/branding/LiveStreamSettings.tsx`,
`src/components/admin/YoutubeManager.tsx`.

Do not wrap `src/lib/supabase.js` `resilientFetch`: database requests keep their own behaviour.

### 3. A visible state when the home page cannot load (REL-10)

`src/pages/home/useHomeData.ts`: add `failed: boolean` to the returned state. It is true when the bundle is
unavailable **and** `loadOneByOne` caught an error, and no saved copy was shown.
`src/pages/Home.tsx`: when `failed`, render above the columns:

```tsx
<p role="alert" className="...">تعذّر تحميل المحتوى الآن. تحقق من اتصالك ثم أعد المحاولة.</p>
<button type="button" onClick={() => window.location.reload()}>إعادة المحاولة</button>
```

(use the classes of the alert in `src/components/ErrorBoundary.tsx`).

## Tests

- `api/_fetch.test.ts` (above).
- `api/live.test.ts`: add "answers `{live:false}` when YouTube does not answer in time" (fake timers).
- `src/lib/timedFetch.test.ts`: same three cases as the server helper.
- `src/pages/home/useHomeData.test.tsx` (jsdom, `renderHook`): with the bundle and the direct queries both failing
  and nothing saved, `failed` is true; with a saved copy, `failed` is false and the saved lists are shown.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
grep -rn "await fetch(" api --include=*.ts | grep -v "\.test\." | grep -v "_fetch.ts" | grep -v "media-link.ts"   # must print nothing
```

## Done when

- [ ] The grep prints nothing.
- [ ] All listed tests pass.
