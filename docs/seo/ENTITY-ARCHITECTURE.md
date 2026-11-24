# Entity architecture (schema.org)

Built by `scripts/seoSchema.mjs`, used by `scripts/prerender.mjs`. One `<script type="application/ld+json">` per page holding one `@graph`.

## The two fixed entities (on every page, identical)

| @id | Type | Facts | Source of each fact |
|---|---|---|---|
| `https://ashrafmazen.com/#website` | WebSite | name, alternateName, description, `inLanguage: ar`, `publisher → #person`, SearchAction | site name and description already on the site |
| `https://ashrafmazen.com/#person` | Person | name «الشيخ أشرف مازن»; alternateName «أشرف مازن», «أشرف بن طه مازن», «أبو عبد الرحمن أشرف بن طه بن مازن», «Ashraf Mazen»; `jobTitle` «داعية وطالب علم»; `knowsLanguage: ar`; `mainEntityOfPage → /`; `sameAs` | names: the previous schema and the channel's own titles ("لفضيلة الشيخ أشرف بن طه مازن"); jobTitle: the existing site schema; sameAs: **only** the active rows of the admin's `social_links` table |

`sameAs` today (from the database, not invented): the YouTube channel `@Ashrafmazen`, Facebook, Telegram, TikTok. Add or fix a profile in the admin ("الواجهة والتواصل") and the next build carries it.

Not added on purpose: `image` of the person (no approved portrait in the repository), birth date, education, affiliations, awards (no verified source).

## Page nodes

| Page | Nodes besides the two above |
|---|---|
| Home | `WebPage` (`about → #person`) |
| `/videos`, `/audio`, `/books`, `/reels`, category, series, playlist | `CollectionPage` + `BreadcrumbList` |
| Lesson | `ItemPage` + `BreadcrumbList` + `VideoObject` (when it has a YouTube video **and** a date) + `Article` (only when it has a written text) |
| Channel video | `ItemPage` + `BreadcrumbList` + `VideoObject` (only when the upload date is known) |
| Book | `ItemPage` + `BreadcrumbList` + `Book` (`author → #person` when the author is the sheikh, else a named Person; `bookFormat: EBook`) |

Relations: every page `isPartOf → #website` and `about → #person`; `VideoObject.author`, `Article.author/publisher → #person`; `Article.mainEntityOfPage` and `VideoObject.isPartOf` → the page. `@id`s are unique inside a graph (`seo-audit` checks it).

## Rules for later changes

1. Never write a fact the database or the channel does not hold (no ratings, durations, view counts or dates guessed from text).
2. One Person, one `@id`, on every page. Do not add a second Person for the sheikh anywhere (e.g. in a component).
3. External profiles go in `social_links`, never hard-coded.
4. Validate a changed page in the Rich Results Test and validator.schema.org (see SEO-TEST-REPORT.md).
