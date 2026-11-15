# WP-04: a stored file is deleted exactly when nothing uses it

Closes: DAT-01, DAT-02, REL-11, SEC-11 (documentation part). Needs WP-09 done.

## Background

A file in the bucket is referenced by a link kept in the database. The same file can be written two ways:
`/api/r2?file=<key>` (older rows) and `https://<public>/<key>` (rows saved after 2026-11-15).
`src/lib/fileLinks.ts` has `fileKey(url)`: the key for either form, or `null` for a link that is not a site file.
Any "is this file still used?" decision must compare **keys**, never link text.

## Steps

### 1. One function that answers "who uses this file"

Create `src/services/data/fileUsage.ts`:

```ts
// Every place a stored file can be referenced. Returns the names of the places that reference `key`.
export async function fileUsers(key: string): Promise<string[]>
```

It reads, in parallel:
- `lessons`: `select id, audio_url` -> `lesson:<id>` when `fileKey(audio_url) === key`;
- `site_settings` rows `home_feature`, `welcome_sound`, `banner_logo_url`, `lesson_extras`, `library_books`,
  `youtube_overrides`: parse each value and collect every string field; a setting uses the file when any string in
  it has `fileKey(...) === key`. Write a small pure helper `stringsIn(value: unknown): string[]` (walks objects and
  arrays) and test it.

Then `export async function deleteIfUnused(url: string, except?: string): Promise<boolean>`:
`key = fileKey(url)`; when `key` is null return false; `users = (await fileUsers(key)).filter((u) => u !== except)`;
when `users.length === 0` call `deleteFromR2(url)` and return true; otherwise false. A failed read (any query error)
returns false: when unsure, keep the file.

### 2. Use it everywhere a link is replaced or removed

- `src/services/data/lessonsAdmin.ts`: replace `dropLessonAudio` with `deleteIfUnused(oldUrl)`.
- `src/services/data/extras.ts` `saveLessonExtras`: when `data.image` is given and differs from the stored picture
  of that lesson, after the record is saved call `deleteIfUnused(previousPicture)`.
- `src/services/data/siteContent.ts`: `saveHomeFeature` (old `imageUrl`), `saveWelcomeSound` (old `url`),
  `removeWelcomeSound` (replace its own lesson query with `deleteIfUnused`). Read the current value **before** writing.
- `src/services/data/settings.ts` (logo) and `src/services/data/books.ts` (`stillUsed` for the PDF and the cover):
  replace their link-text comparisons with `deleteIfUnused`.

A failed delete never fails the save: wrap the call in `try/catch` and log (WP-05 format).

### 3. Order of operations in a save (REL-11)

In `createLesson` / `updateLesson` / `deleteLesson` keep this order and add a comment stating it:
1. write the lesson row; 2. write the extras; 3. only then delete old files.
If step 2 throws after step 1 succeeded, throw an error whose message says so:
"حُفظ الدرس لكن تعذّر حفظ (المميز / الفصول / الصورة). أعد الحفظ." so the admin knows to save again.

### 4. Document what "public by address" means (SEC-11)

Add to `docs/PRODUCTION.md` under "قيود معروفة": files are public to anyone who has their address; addresses are
random; library PDFs are still served through `/api/r2` with a signed, short-lived link.

## Tests: `src/services/data/fileUsage.test.ts` (use `installFakeDatabase` from WP-09)

- `stringsIn` returns every string of a nested object and array; ignores numbers and null.
- a file used by one lesson in the `/api/r2?file=` form and asked about in the public form -> `fileUsers` lists that lesson (DAT-01).
- `deleteIfUnused` deletes when nobody uses the file, and does not when a setting (`welcome_sound`) uses it.
- `deleteIfUnused` with `except: 'lesson:1'` ignores that lesson.
- a failing query -> returns false and `deleteFromR2` is not called.
- replacing a lesson's picture deletes the old picture's file; removing the picture deletes it; saving the same
  picture deletes nothing.

Mock `../r2` `deleteFromR2` with `vi.fn()` and assert its calls.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
grep -rn "eq('audio_url'" src   # must print nothing
```

## Done when

- [ ] The grep prints nothing; all cases pass.
- [ ] `STATE.md` notes: "files are deleted by key; orphans created before this package remain (clean-up is OWNER decision)".
