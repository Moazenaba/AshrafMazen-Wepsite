# WP-01: security hardening of the server functions

Closes: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07 (code part). Needs WP-09 done.

## Steps

### 1. One shared rate limiter (SEC-01, SEC-07)

Create `api/_rateLimit.ts` (pure, no network):

```ts
// Best effort per server instance: at most `max` calls per `windowMs` for one key (an address).
export function createLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => { /* true = allowed; prune old hits; clear the map above 5000 keys */ };
}
export const addressOf = (req: any): string =>
  String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
```

- Test `api/_rateLimit.test.ts`: allows `max` calls then refuses; allows again after the window (inject `now`);
  two addresses do not share a count; the map is cleared above 5000 keys.
- `api/submit.ts`: replace its private `recent` map and `tooMany` with `createLimiter(5, 3_600_000)` and
  `addressOf`. Its existing tests must still pass unchanged.
- `api/media-link.ts`: add `const allowed = createLimiter(6, 600_000)` (6 calls per 10 minutes per address). At the
  top of the handler, after the id check: `if (!allowed(addressOf(req))) return res.status(429).send(JSON.stringify({ error: 'طلبات كثيرة. حاول بعد عشر دقائق.' }))`.
- Add a 2-minute memo of a **successful** answer in `api/media-link.ts`: `Map<string, { at: number; link }>` keyed
  by `${id}:${kind}`; a hit answers at once without calling any service. Cap the map at 200 entries.
- Extend `api/media-link.test.ts`: the 7th call from one address answers 429; a second call for the same id within
  2 minutes does not call `fetch` again.

### 2. Validate outside links before probing them (SEC-02)

In `api/_providers.ts` add and export:

```ts
// A link an outside service handed back may be probed only if it is https and not a private or local address
export function isSafeMediaUrl(value: string): boolean
```

Rules: must parse as a URL; protocol `https:`; hostname is not `localhost`, not an IPv4 literal in `10.`, `127.`,
`169.254.`, `172.16-31.`, `192.168.`, not an IPv6 literal, and contains a dot.
In `api/media-link.ts` `attempt`: after `ask()`, `if (!link || !isSafeMediaUrl(link.url))` treat it as "no link"
with `why: 'unsafe link'`.
Tests in `api/_providers.test.ts`: accepts `https://cdn.example.com/a.mp3`; refuses `http://…`, `https://localhost/x`,
`https://127.0.0.1/x`, `https://10.1.2.3/x`, `https://[::1]/x`, `file:///etc/passwd`, `javascript:1`, `nope`.

### 3. Admin delete only inside the site's folders (SEC-03)

In `api/r2.ts` move the folder rule to one exported constant and use it in both places:

```ts
export const SITE_FOLDERS = /^(library\/(files|covers)|audio|branding|media\/video|setup-check)\//;
const isSiteKey = (key: string) => SITE_FOLDERS.test(key) && !key.includes('..');
```

- `serveFile`: use `isSiteKey` but keep `setup-check` out of the public GET (public rule = `SITE_FOLDERS` without
  `setup-check`; write it as a second constant `PUBLIC_FOLDERS`).
- `remove`: after `keyFromLink`, `if (!key || !isSiteKey(key)) return send(res, 400, { error: 'هذا الرابط ليس ملفاً مرفوعاً على الموقع.' })`.
- Test in `api/r2.post.test.ts`: delete of `private/x.txt` and of `audio/../x` answers 400 and calls no `fetch` to storage.

### 4. Upload size cannot exceed what was signed (SEC-04)

In `api/_r2.ts` `presign` accept an optional `contentLength?: number`; when given, add `content-length` to the signed
headers: `X-Amz-SignedHeaders=content-length;host` and the canonical headers `content-length:<n>\nhost:<host>\n`.
In `api/r2.ts` `sign` pass `Number(body.size)` and return it as `contentLength` in the JSON. The browser already
sends the file with that exact length; a different length fails the signature at the storage.

- Read the current `presign` first and keep the header order sorted (SigV4 requires sorted, lowercase names).
- Test in `api/r2.post.test.ts`: the signed address for a 1000-byte file contains `X-Amz-SignedHeaders=content-length%3Bhost`.
- **Live check (owner or a session with the admin signed in):** upload one small picture from the admin; it must
  still succeed. If the storage answers 403 `SignatureDoesNotMatch`, revert this step only, and record it in
  `STATE.md` under "blocked" with the exact response.

### 5. Content-Security-Policy (SEC-05)

Edit the `Content-Security-Policy` value in `vercel.json`:

- `connect-src`: add `https://*.r2.dev` and, **only if WP-14 (Quran) is merged**, `https://www.mp3quran.net https://api-staging.mp3quran.net`.
- Append `; report-uri /api/csp-report` **only after WP-05 created that function**; otherwise skip this bullet and note it in `STATE.md`.

Update `src/test/csp.test.ts`: add an expectation that `connect-src` contains `https://*.r2.dev`.

### 6. New-tab links (SEC-06)

Add `rel="noopener noreferrer"` to the `target="_blank"` links in
`src/pages/admin/dashboard/CategoriesTab.tsx`, `LessonsTab.tsx`, `SeriesTab.tsx`.
Add `src/test/links.test.ts`: read every `.tsx` under `src/`, and for each line containing `target="_blank"` assert
that `rel="noopener` appears within the 4 lines before or after it. (This keeps the rule for future code.)

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
node scripts/smoke-test.mjs https://ashraf-mazen.vercel.app     # read-only; must still say ALL PASSED
```

## Done when

- [ ] All new tests pass; the old `api/submit.test.ts` passes unchanged.
- [ ] `STATE.md` records whether step 4 was kept or reverted, and whether `report-uri` was added.
