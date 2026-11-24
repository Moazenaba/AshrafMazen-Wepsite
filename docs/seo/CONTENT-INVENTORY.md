# Content inventory (build of 2026-11-24)

Counted from the data `scripts/site-data.mjs` reads and from `dist/`.

| Type | Count | URL pattern | Text depth | Notes |
|---|---|---|---|---|
| Home | 1 | `/` | lists of sections, series, lessons, playlists, latest videos | |
| Libraries | 5 | `/videos` `/audio` `/books` `/reels` `/quran` | lists | `/books` is empty (0 published books) |
| Categories | 6 | `/category/{slug}` | name + description (37–39 characters on 4 of them) | «المصطلح» and «مصطلح الحديث» overlap |
| Series | 3 | `/series/{slug}` | name + description | `tessst` is a test entry |
| Lessons | 2 | `/lesson/{uuid}` | title, series, written text when present | the only pages that can carry an Article |
| Channel playlists | 14 | `/playlist/{id}` | title + ordered list | 2 share one title |
| Channel videos | 375 | `/video/{id}` | title, playlist, neighbours | 146 with an upload date |
| Live, search, contribute | 3 | | | search and contribute are noindex |

Channel playlists: الوابل الصيب · أخلاق حملة القرآن · كتاب التوبة · المسيح الدجال · ٢٠٠ سؤال وجواب · رفع الملام عن الأئمة الأعلام · القول المفيد فى شرح كتاب التوحيد · دعائم منهاج النبوة (×2) · سلسلة عداوة الشيطان للإنسان · المعتقد الصحيح · الأصول من علم الأصول · شرح العقيدة الواسطية · خطب الجمعة.

## Thin or duplicate

- Video pages: real but short (a title and links). Depth comes only from written text or a description; none is invented.
- Category descriptions under 40 characters: `aqeedah`, `fiqh`, `khutab`, `mustalah` — write 1–2 real sentences each in the admin.
- `tessst`, the duplicate category, the duplicate playlist title: see MASTER-AUDIT.md.

## Opportunities (real content, in order of value)

1. Transcripts of the most-watched lessons (the admin already supports `transcript`).
2. A short «عن الشيخ» text with only facts the sheikh approves (it can then feed the Person schema: description, image).
3. Descriptions for categories and playlists.
4. Publishing the books in `/books`.
