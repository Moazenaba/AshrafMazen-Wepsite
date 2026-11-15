# WP-02: the admin is not signed out by a network hiccup

Closes: REL-01, SEC-12 (the auth part). Needs WP-09 done.

## The bug

`src/services/data/auth.ts` `checkCurrentAdmin`:

```ts
const { data: adminRecord } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
if (!adminRecord) { await supabase.auth.signOut(); return null; }
```

The query's `error` is ignored. A failed request (offline, timeout) gives `data: null`, so the admin is signed out
and loses unsaved work.

## Steps

1. In `src/services/data/auth.ts` define and export:

   ```ts
   export type AdminCheck = { state: 'admin'; user: AdminUser } | { state: 'not-admin' } | { state: 'signed-out' } | { state: 'unknown' };
   export async function checkAdminState(): Promise<AdminCheck>
   ```

   - no saved session (`hasStoredSession()` false) -> `signed-out`;
   - `supabase.auth.getUser()` throws or returns an `error` whose message is a network failure -> `unknown`;
   - no user -> `signed-out`;
   - the `admins` query returns an `error` -> `unknown` (do **not** sign out);
   - the query succeeds with no row -> `signOut()` then `not-admin`;
   - a row -> `admin`.
2. Keep `checkCurrentAdmin()` for its callers, implemented as: `admin` -> the user; anything else -> `null`.
   It no longer signs out on `unknown`.
3. `src/pages/admin/AdminPage.tsx` (the gate): use `checkAdminState`. On `unknown` show a small message
   "تعذّر التحقق من الجلسة. تحقق من الاتصال." with a "إعادة المحاولة" button that calls it again; do not show the
   sign-in form and do not clear anything.
4. Replace `console.error('Login auth error:', authErr)` and the other two `console.error` calls in this file with a
   single line each that logs only `error.message` and `error.status` (never the whole object).

## Tests: `src/services/data/auth.test.ts`

Mock `../../lib/supabase` with `vi.mock` (an object with `auth.getUser`, `auth.signOut`, `from().select().eq().maybeSingle()`
and `hasStoredSession`). Cases:

- no stored session -> `signed-out`, `getUser` not called;
- admins query answers `{ data: null, error: { message: 'Failed to fetch' } }` -> `unknown`, `signOut` NOT called;
- admins query answers `{ data: null, error: null }` -> `not-admin`, `signOut` called once;
- admins query answers a row -> `admin` with the user's e-mail;
- `getUser` rejects -> `unknown`, `signOut` not called.

Component test `src/pages/admin/AdminPage.test.tsx`: with `checkAdminState` mocked to `unknown`, the page shows the
retry button and no password field; clicking retry calls it again.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
```

Then `npm run dev`, open `/dev/admin`: the dashboard still opens.

## Done when

- [ ] The five unit cases and the component case pass.
- [ ] No call to `signOut()` remains on an error path (search `signOut` in `src/services/data/auth.ts`).
