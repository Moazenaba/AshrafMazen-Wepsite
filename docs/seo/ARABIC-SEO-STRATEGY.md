# Arabic SEO strategy

## Principles

1. **One official spelling everywhere we control**: «الشيخ أشرف مازن» (with hamza). Variants are matched by search engines (Google folds أ/ا, ة/ه, ى/ي and diacritics for Arabic) — they are not written into titles.
2. **Titles say what the page is, then who**: «{subject} - الشيخ أشرف مازن». The name once, never repeated, never a list of spellings.
3. **Titles are cleaned, not rewritten**: hashtag tails are removed (`cleanVideoTitle`), the sheikh's wording of a lesson title is kept, including its own spelling («فى», «عزوجل»).
4. **Descriptions are sentences**, built from real data (playlist name, series, counts, written text).
5. **Text is real Arabic in the HTML** (prerendered `h1`, lists, transcripts), RTL, UTF-8 — readable without JavaScript.

## Where each intent lands

See KEYWORD-PAGE-MAPPING.md (intent → page) and ARABIC-NAME-VARIATIONS.md (spellings, normalization, the Search Console process).

## Site search (on the site itself)

`src/utils/arabicSearch.ts` (`normalizeArabic`) already strips diacritics and tatweel, folds أإآ→ا, ى→ي, ة→ه and punctuation, so a visitor typing «اشرف» or «الصلاه» finds «أشرف» / «الصلاة». Covered by its own tests.

## What is a hypothesis

No keyword tool or Search Console data was available in this pass. Which queries people use, and how many, is **not known yet**. The mapping is built from the content that exists and the spellings the channel itself uses; it must be checked against Search Console after 4–6 weeks (process in ARABIC-NAME-VARIATIONS.md §D).
