# Arabic name variations and query intelligence

Official form used by the site: **«الشيخ أشرف مازن»**. Full name in the channel's own titles: «أشرف بن طه مازن», «أشرف بن طه آل مازن»; kunya in the existing schema: «أبو عبد الرحمن أشرف بن طه بن مازن».

## A. Variation inventory

**Verified** = seen in the sheikh's own channel titles (count in 376 titles, `src/data/youtube-library.ts`, 2026-11-24). **Hypothesis** = plausible query, not yet seen in any data.

| Variation | Kind | Status |
|---|---|---|
| الشيخ أشرف مازن | official, hamza | verified (18) |
| الشيخ اشرف مازن | no hamza | verified (36) — the channel itself writes it this way |
| #الشيخ_أشرف_مازن | hashtag | verified (95) |
| لفضيلة الشيخ أشرف -مازن | honorific + typo hyphen | verified (120 with the hyphen) |
| أشرف بن طه مازن / أشرف بن طه آل مازن | full name | verified (4 / 3) |
| أشرف مازن / اشرف مازن | name without title | hypothesis |
| شيخ أشرف مازن / الشيخ أشرف / شيخ أشرف | partial title | hypothesis |
| أشرف مازن الشيخ, دروس أشرف مازن, أشرف مازن دروس | word order | hypothesis |
| فيديوهات / صوتيات / كتب / محاضرات / خطب + name | content intent | hypothesis |
| محاضرات الشيخ أشرف مازن MP3, تحميل كتب الشيخ أشرف مازن | download intent | hypothesis |
| أين أجد دروس الشيخ أشرف مازن؟ / عايز أسمع محاضرات الشيخ أشرف مازن / جميع فيديوهات الشيخ | conversational (MSA and Egyptian) | hypothesis |
| اشرف مزن, أشرف مازين, اشرف مازم, أشرف ماذن | spelling/phonetic mistakes | hypothesis (discovery only, never written on the site) |
| Ashraf Mazen, Sheikh Ashraf Mazen, Ashraf Mazin | Latin transliteration | hypothesis; «Ashraf Mazen» is in the schema `alternateName` |

## B. Normalization rules (for analysis and clustering only)

Apply to a query before grouping it; **never** to titles, URLs or visible text.

1. Remove diacritics U+064B–U+0652 and tatweel U+0640.
2. أ إ آ ٱ → ا ; ؤ → و ; ئ → ي ; standalone ء removed when comparing names.
3. ى → ي ; ة → ه (end of word).
4. `_`, `#`, `-`, punctuation → space; collapse spaces; drop a word repeated twice in a row.
5. Drop title words for the entity match: الشيخ، شيخ، فضيلة، لفضيلة، العلامة.
6. Arabic-Indic digits ٠-٩ → 0-9.
7. Intent words are kept and classified (step C).

The site's own search already does 1–4 (`src/utils/arabicSearch.ts` → `normalizeArabic`).

Example: «لفضيلة الشيخ أشرف -مازن» → «اشرف مازن»; «اشرف مازن» → «اشرف مازن» → same entity.

## C. Intent clusters → page

| Cluster | Trigger words after normalization | Page |
|---|---|---|
| Entity / official site | name only, «موقع» | `/` |
| Biography / identity | «من هو», «سيرة», «نبذة» | `/` (no biography page until the sheikh approves a text) |
| General lessons | دروس، محاضرات، شروح، كاملة | `/` → `/videos` |
| Video | فيديو، فيديوهات، يوتيوب، قناة | `/videos` |
| Audio | صوتيات، اسمع، mp3، صوتي | `/audio` |
| Books | كتب، كتاب، pdf | `/books` |
| Download | تحميل، تنزيل | the library page of the asked type |
| Series / topic | a series name (الوابل الصيب، كتاب التوبة، الواسطية …) | that `/playlist/{id}` or `/series/{slug}` |
| Sermons | خطبة، خطب، الجمعة | خطب الجمعة playlist (see the mapping doc for the overlap) |
| Live | بث، مباشر، لايف | `/live` |

## D. Search Console process (run monthly, starting 4–6 weeks after verification)

1. Search Console → Performance → Search results → last 28 days → Queries tab → export.
2. Normalize each query (B) and assign a cluster (C).
3. Look for:
   - **High impressions, CTR under 2%** → rewrite that page's title/description (still one name, natural).
   - **Average position 4–20** → add internal links to the page from the home page and related pages; add real text.
   - **Spellings with impressions** → confirm they reach the right page; no new page for a spelling.
   - **Query → wrong page** (Pages tab with the query filter) → strengthen the right page's title and links.
   - **High-impression queries with no matching content** → a content request for the sheikh (e.g. a topic with no lesson).
4. Record the findings in this file under a dated heading. **Only real exported numbers go here.**

## E. Metadata rules

- One name per title, at the end: «{subject} - الشيخ أشرف مازن».
- No spelling lists in titles, descriptions, headings or hidden text.
- Spelling variants live in `Person.alternateName` only when they are real names (full name, kunya, Latin form), not misspellings.

## F. Search Console data

None available yet (the property is not verified at the time of writing). Nothing in this file is a measured search volume.
