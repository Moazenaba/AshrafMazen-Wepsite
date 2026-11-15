# WP-11: every admin form saves, validates and deletes correctly

Closes: REL-09, INT-02, INT-03, INT-09, DAT-06, DAT-07. Needs WP-09 done.

## Part A: one source for file rules (INT-02, INT-03)

1. Create `src/constants/fileRules.js` (plain JavaScript so `api/` can import it with the `.js` extension, like
   `src/constants/nameFontList.js`) and `src/constants/fileRules.d.ts`:

   ```js
   // The one list of what may be uploaded: folder, extensions, size. api/r2.ts enforces it; every screen shows it.
   export const FILE_RULES = {
     pdf:   { folder: 'library/files',  extensions: ['pdf'], maxMb: 200, type: 'application/pdf' },
     cover: { folder: 'library/covers', extensions: ['jpg', 'jpeg', 'png', 'webp'], maxMb: 5, type: '' },
     audio: { folder: 'audio',          extensions: ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus'], maxMb: 500, type: '' },
     logo:  { folder: 'branding',       extensions: ['png', 'jpg', 'jpeg', 'webp'], maxMb: 2, type: '' },
     hero:  { folder: 'branding/hero',  extensions: ['png', 'jpg', 'jpeg', 'webp'], maxMb: 8, type: '' },
     video: { folder: 'media/video',    extensions: ['mp4', 'webm', 'mov', 'm4v'], maxMb: 4000, type: '' },
   };
   export const acceptOf = (kind) => FILE_RULES[kind].extensions.map((e) => `.${e}`).join(',');
   export const describeRule = (kind) => `${FILE_RULES[kind].extensions.join('، ')} (حتى ${FILE_RULES[kind].maxMb} ميجابايت)`;
   export function checkFile(kind, name, size) { /* returns an Arabic message or null */ }
   ```

   Copy the values from `api/r2.ts` `KINDS` exactly (read it first; if they differ from the list above, `api/r2.ts` wins).
2. `api/r2.ts`: `import { FILE_RULES } from '../src/constants/fileRules.js'` and delete its own `KINDS`.
3. Replace every other copy with the shared one:
   `src/services/data/audioUpload.ts` (`AUDIO_EXTENSIONS`), `src/components/admin/FileUploadButton.tsx` (`ACCEPT`),
   `src/components/admin/modals/lesson/AudioField.tsx` (`accept`), `src/components/admin/branding/BannerSettings.tsx`
   (the "2MB" check and the text "PNG, SVG, JPG, WEBP" -> `describeRule('logo')`, which fixes INT-02),
   `src/services/data/settings.ts`, `src/services/data/books.ts`, `LessonImageField.tsx`, `HomeFeatureSettings.tsx`.
   `FileUploadButton` calls `checkFile(kind, file.name, file.size)` **before** asking the server, and shows the message.
4. Test `src/constants/fileRules.test.ts`: `checkFile` refuses a wrong extension naming it, refuses an oversize file
   naming the limit, accepts a valid file, treats the extension case-insensitively; `acceptOf('audio')` lists all six.
5. Guard test `src/test/fileRulesSingleSource.test.ts`: read every file under `src/` and `api/` (not tests, not
   `fileRules.js`); fail if any contains the regex `/['"](mp3|m4a|webp|jpeg)['"]\s*,\s*['"]/` (a second hand-written
   extension list).

## Part B: forms that can always be submitted (REL-09)

1. Guard test `src/test/formFields.test.ts`: no `.tsx` under `src/components/admin` or `src/pages/admin` contains
   `type="url"` or `type="email"` on a field whose value can be a site file link. Simplest rule that is safe: there is
   **no** `type="url"` anywhere under those folders. (A site file link is `/api/r2?file=…`, which a url field rejects
   and the browser then refuses to submit the form without any message.)
2. For each admin form, write a component test that fills valid values, submits, and asserts the save function was
   called once with the expected data; and one that submits invalid values and asserts the message is shown and the
   save function was not called. Forms: `LessonModal`, `SeriesModal`, `CategoryModal`, `BookModal`,
   `BannerSettings`, `HomeFeatureSettings`, `WelcomeSoundSettings`, `LiveStreamSettings`, `ContactSettings`,
   `SocialLinkModal`, `SideMenuSettings`, `NameFontSettings`, `QuotesManager`, `ReelsManager`, `YoutubeManager`.
   Mock the service module of each form. One test file per form, next to it.
3. While writing each test, if the form shows a raw database message, routes every failure to one generic text, or
   has no way to remove a value it lets you set (the welcome sound and hero picture were such cases), fix it in the
   same commit and list the fix in `STATE.md`.

## Part C: small correctness fixes

- DAT-06: `src/services/data/catalogAdmin.ts`: before `createCategory` / `createSeries` and in the two updates, query
  for an existing row with the same slug (excluding itself); when found throw
  "هذا الاسم المختصر (slug) مستخدم من قبل. اختر اسماً آخر." Tests with the fake database.
- DAT-07: `src/components/Navbar.tsx` bookmark count: count only ids that still exist. Use the ids present in the site
  bundle's lessons plus the library's video ids; a bookmark that matches neither is not counted. Test the pure
  counting function.
- INT-09: split `src/components/admin/branding/SocialLinks.tsx` (367 lines) by moving the list row into
  `SocialLinkRow.tsx`; split `src/context/AudioContext.tsx` (352) by moving the Media Session code into
  `src/context/mediaSession.ts`. No behaviour change; existing tests must pass.

## Verify

```
npm run typecheck && npm run test:coverage && npm run build
```

Then `npm run dev` -> `/dev/admin`: open each tab once; each loads without an error in the browser console.

## Done when

- [ ] Both guard tests exist and pass.
- [ ] Fifteen form test files exist, each with a "saves" and a "refuses" case.
- [ ] No file under `src/` is over 350 lines except `src/data/**` (`git ls-files src | xargs wc -l | sort -nr | head`).
