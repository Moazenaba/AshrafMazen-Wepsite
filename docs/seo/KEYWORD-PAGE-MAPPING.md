# Keyword → page mapping

Queries are grouped by **intent**; each group points at one existing page. All queries here are hypotheses built from the site's content (no search volumes are known — see ARABIC-NAME-VARIATIONS.md for verification).

| Intent cluster | Example queries (hypothesis) | Target page | Why this page |
|---|---|---|---|
| Who is he / the official site | الشيخ أشرف مازن · أشرف مازن · موقع الشيخ أشرف مازن · Ashraf Mazen | `/` | WebSite + Person entity, sameAs to his channels |
| All lessons | دروس الشيخ أشرف مازن · محاضرات الشيخ أشرف مازن · دروس أشرف مازن كاملة | `/` then `/videos` | home lists every section and series |
| Videos | فيديوهات الشيخ أشرف مازن · جميع فيديوهات أشرف مازن · قناة أشرف مازن | `/videos` | title «المرئيات: دروس ومحاضرات الشيخ أشرف مازن بالفيديو» |
| Audio / MP3 | صوتيات أشرف مازن · محاضرات الشيخ أشرف مازن mp3 · عايز أسمع محاضرات الشيخ | `/audio` | title «الصوتيات: دروس ومحاضرات الشيخ أشرف مازن الصوتية»; lessons have downloads |
| Books / download | كتب الشيخ أشرف مازن · تحميل كتب أشرف مازن pdf | `/books` | **empty today** — the query can only be served once books are published |
| Short clips | مقاطع الشيخ أشرف مازن · ريلز أشرف مازن | `/reels` | |
| Live | بث مباشر الشيخ أشرف مازن | `/live` | |
| A named series | شرح الوابل الصيب أشرف مازن · كتاب التوبة أشرف مازن · ٢٠٠ سؤال وجواب · شرح العقيدة الواسطية أشرف مازن · الأصول من علم الأصول · القول المفيد شرح كتاب التوحيد · المسيح الدجال · أخلاق حملة القرآن · دعائم منهاج النبوة · المعتقد الصحيح · عداوة الشيطان للإنسان · رفع الملام عن الأئمة الأعلام | `/playlist/{id}` of that series | each playlist page has its clean title + full ordered list |
| A single lesson | «{series} الدرس 5» · «{topic} أشرف مازن» | `/video/{id}` or `/lesson/{id}` | clean title = the lesson's real title |
| Friday sermons | خطب الجمعة الشيخ أشرف مازن · خطبة الجمعة أشرف مازن | `/playlist/…` «خطب الجمعة», `/series/خطبة-الجمعة`, `/category/khutab` | **three pages compete** — link them to each other and pick one as the main list |
| Topic (عقيدة، فقه، أصول، مصطلح) + name | دروس العقيدة أشرف مازن · فقه الطهارة أشرف مازن | `/category/{slug}` | needs real category descriptions |
| Quran | القرآن الكريم استماع | `/quran` | generic intent, not a target for the name |

## Not given their own pages (on purpose)

- Spelling variants (اشرف / أشرف, شيخ / الشيخ, word order): same intent as the home page.
- "Download" / "كاملة" / "mp3": same intent as the library page that holds the files.
- Generic religious topics without the name (e.g. «شرح كتاب التوبة»): competing with large sites requires real written content per lesson, not landing pages.
