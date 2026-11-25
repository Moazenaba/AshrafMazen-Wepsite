// Runs after `vite build`: writes a real HTML file for every public page (home, libraries, categories, series,
// lessons, playlists, channel videos, books) into dist/, each with its own <title>, description, canonical
// address, social preview, structured data (schema.org) and readable text with links. Search engines and link
// previews then see each page's own content in the first response instead of one empty page for the whole site.
// The app starts on top of it as before (createRoot replaces the text inside #root).
//
// dist/app.html is the same shell without a canonical address: vercel.json sends any page not written here
// (a lesson added after the last deploy) to it, and the app sets the canonical address itself (useCanonical).
//
//   node scripts/prerender.mjs          fails loudly on a problem
//   node scripts/prerender.mjs --soft   used by `npm run build`: on a problem it only writes app.html
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { excerpt, loadSiteData, root, siteUrl, youtubeId } from './site-data.mjs';
import { esc, render as renderPage, withNameFont, withSiteSeed } from './prerenderParts.mjs';
import { contentHash } from './contentHash.mjs';
import { makeSchema } from './seoSchema.mjs';
import { featureCardHtml, readFeature } from './prerenderFeature.mjs';
import { cleanVideoTitle, namedTitle as named, videoDescription } from '../src/lib/seoText.ts';

const soft = process.argv.includes('--soft');
const dist = resolve(root, 'dist');
// The shell's own JSON-LD is replaced by each page's graph (one identity, no duplicate Person)
let template = readFileSync(resolve(dist, 'index.html'), 'utf8').replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');

const SITE_NAME = 'الشيخ أشرف مازن';
const DEFAULT_DESCRIPTION =
  'الموقع الرسمي للشيخ أشرف مازن: دروس وشروحات وخطب ومحاضرات علمية مرئية ومسموعة ومكتوبة، ومكتبة كتب PDF.';


const site = { siteUrl, verification: '' };
// Rebuilt with the admin's social links once the data is read
let schema = makeSchema({ siteUrl, siteName: SITE_NAME, description: DEFAULT_DESCRIPTION });
// The first-visit copy goes only into the home page and app.html (`seeded`), never into every page
let seededTemplate = null;
// The share picture of pages that have none of their own (public/og-image.png, 1200×630)
const defaultImage = existsSync(resolve(dist, 'og-image.png')) ? `${siteUrl}/og-image.png` : undefined;
const render = (page) => renderPage(page.seeded && seededTemplate ? seededTemplate : template, { ...page, image: page.image || defaultImage }, site);
const url = (path) => `${siteUrl}${encodeURI(path)}`;
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const link = (path, text) => `<a href="${esc(path)}">${esc(text)}</a>`;
const list = (items) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '');

const verification = [
  process.env.GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}" />`,
  process.env.BING_SITE_VERIFICATION && `<meta name="msvalidate.01" content="${esc(process.env.BING_SITE_VERIFICATION)}" />`,
]
  .filter(Boolean)
  .join('\n    ');
site.verification = verification;



const written = { count: 0 };
function write(page) {
  const file = page.path === '/' ? resolve(dist, 'index.html') : resolve(dist, `.${page.path}`, 'index.html');
  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, render({ ...page, seeded: page.path === '/' }), 'utf8');
  written.count += 1;
}

// The fallback shell, written first so a failure below still leaves the site working
writeFileSync(resolve(dist, 'app.html'), render({ path: '/', title: `${SITE_NAME} | دروس وخطب ومحاضرات علمية`, description: DEFAULT_DESCRIPTION, noCanonical: true, seeded: true, schema: [schema.graph([])] }), 'utf8');

let data;
let seed = null; // the /api/site answer seeded into the home page (its settings hold the featured card)
try {
  data = await loadSiteData();
  template = withNameFont(template, data.nameFont);
  seededTemplate = await withSiteSeed(template, async () => {
    const seedUrl = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    const { readSiteData } = await import('../api/site.ts');
    return (seed = await readSiteData(seedUrl, process.env.VITE_SUPABASE_ANON_KEY || ''));
  });
  schema = makeSchema({ siteUrl, siteName: SITE_NAME, description: DEFAULT_DESCRIPTION, socials: data.socials });
  // The fallback shell again, now with the chosen font
  writeFileSync(resolve(dist, 'app.html'), render({ path: '/', title: `${SITE_NAME} | دروس وخطب ومحاضرات علمية`, description: DEFAULT_DESCRIPTION, noCanonical: true, seeded: true, schema: [schema.graph([])] }), 'utf8');
} catch (err) {
  // PRERENDER_STRICT=1 (set in Vercel after one clean deploy) makes a production build fail instead of shipping unprerendered pages
  if (soft && process.env.PRERENDER_STRICT !== '1') {
    console.warn(`::warning::prerender skipped (pages will render in the browser only): ${err.message}`);
    try {
      writeFileSync(resolve(dist, 'build-warnings.json'), JSON.stringify({ prerender: false, reason: String(err.message).slice(0, 300) }));
    } catch {
      // dist is missing: the build itself failed earlier
    }
    process.exit(0);
  }
  console.error(err.message);
  process.exit(1);
}
const { categories, series, lessons, books, socials, library } = data;
writeFileSync(resolve(dist, 'content-hash.txt'), contentHash(lessons), 'utf8');

// Only addresses that are safe as folder names (every id and slug the site makes today)
const SAFE = /^[\p{L}\p{N}_-]{1,80}$/u;
const seriesById = new Map(series.map((s) => [s.id, s]));
const categoryById = new Map(categories.map((c) => [c.id, c]));
const lessonsBySeries = new Map();
for (const lesson of lessons) {
  if (!lessonsBySeries.has(lesson.series_id)) lessonsBySeries.set(lesson.series_id, []);
  lessonsBySeries.get(lesson.series_id).push(lesson);
}
for (const items of lessonsBySeries.values()) items.sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0));

schema = makeSchema({ siteUrl, siteName: SITE_NAME, description: DEFAULT_DESCRIPTION, socials });
const nav = `<nav><p>${[
  link('/', SITE_NAME), // the name points to the home page from every page, so a search for the name lands there
  link('/videos', 'المرئيات'),
  link('/audio', 'الصوتيات'),
  link('/books', 'المكتبة'),
  link('/reels', 'الريلز'),
  link('/quran', 'القرآن الكريم'),
].join(' · ')}</p></nav>`;
const kind = (l) => [l.youtube_url && 'مرئي', l.audio_url && 'صوتي', l.transcript && 'مكتوب'].filter(Boolean).join('، ');
// One page: its graph is the site, the sheikh, the page and (when given) its breadcrumb trail and own nodes
const page = ({ path, type, title, description, image, crumbs, date, nodes = [], ...rest }) =>
  write({
    path,
    title,
    description,
    image,
    schema: [
      schema.graph([
        schema.webPage({ path, type, name: title, description, image, crumbs, date }),
        crumbs && schema.breadcrumbs(path, crumbs),
        ...nodes,
      ]),
    ],
    ...rest,
  });

// Home
page({
  path: '/',
  type: 'ProfilePage',
  title: `${SITE_NAME} | دروس وخطب ومحاضرات علمية`,
  description: DEFAULT_DESCRIPTION,
  // The featured card right under the name, painted with the first response (the page's LCP on phones)
  body: `${nav}<h1>${SITE_NAME}</h1>${featureCardHtml(readFeature(seed?.settings))}<p>${esc(DEFAULT_DESCRIPTION)}</p>
<h2>الأقسام العلمية</h2>${list(categories.map((c) => link(`/category/${c.slug}`, c.name)))}
<h2>السلاسل العلمية</h2>${list(series.map((s) => link(`/series/${s.slug}`, s.title)))}
<h2>أحدث الدروس</h2>${list(lessons.slice(0, 40).map((l) => link(`/lesson/${l.id}`, l.title)))}
<h2>سلاسل الدروس المرئية</h2>${list(library.map((p) => `${link(`/playlist/${p.id}`, cleanVideoTitle(p.title))} (${p.videos.length} فيديو)`))}
<h2>أحدث الفيديوهات</h2>${list(library.flatMap((p) => p.videos.slice(0, 2)).filter((v) => !lessons.some((l) => youtubeId(l.youtube_url) === v.id)).slice(0, 20).map((v) => link(`/video/${v.id}`, cleanVideoTitle(v.title))))}`,
});

// Libraries
page({
  path: '/videos',
  type: 'CollectionPage',
  title: `المرئيات: دروس ومحاضرات بالفيديو - ${SITE_NAME}`,
  description: `دروس وخطب ومحاضرات الشيخ أشرف مازن المرئية، مرتبة في ${library.length} سلسلة منها ${library
    .slice(0, 3)
    .map((p) => `«${cleanVideoTitle(p.title)}»`)
    .join(' و')}.`,
  crumbs: [{ name: 'المرئيات', path: '/videos' }],
  body: `${nav}<h1>المرئيات</h1><p>دروس الشيخ أشرف مازن المرئية مرتبة في سلاسل؛ اختر سلسلة لتشاهد دروسها بالترتيب.</p>
${list(library.map((p) => `${link(`/playlist/${p.id}`, cleanVideoTitle(p.title))} (${p.videos.length} فيديو)`))}`,
});
const audioLessons = lessons.filter((l) => l.audio_url);
page({
  path: '/audio',
  type: 'CollectionPage',
  title: `الصوتيات: دروس ومحاضرات صوتية - ${SITE_NAME}`,
  description: 'استمع إلى دروس الشيخ أشرف مازن الصوتية: شروح وخطب ومحاضرات، مع إمكانية التحميل.',
  crumbs: [{ name: 'الصوتيات', path: '/audio' }],
  body: `${nav}<h1>الصوتيات</h1><p>الدروس الصوتية للشيخ أشرف مازن.</p>${list(audioLessons.map((l) => link(`/lesson/${l.id}`, l.title)))}`,
});
page({
  path: '/books',
  type: 'CollectionPage',
  title: `المكتبة: كتب ورسائل PDF - ${SITE_NAME}`,
  description: 'مكتبة كتب ورسائل PDF للقراءة والتحميل من موقع الشيخ أشرف مازن.',
  crumbs: [{ name: 'المكتبة', path: '/books' }],
  body: `${nav}<h1>المكتبة</h1>${books.length ? list(books.map((b) => link(`/book/${b.id}`, b.title))) : '<p>تضاف الكتب هنا عند نشرها.</p>'}`,
});
page({
  path: '/reels',
  type: 'CollectionPage',
  title: `الريلز: مقاطع قصيرة - ${SITE_NAME}`,
  description: 'مقاطع قصيرة من دروس وخطب الشيخ أشرف مازن.',
  crumbs: [{ name: 'الريلز', path: '/reels' }],
  body: `${nav}<h1>الريلز</h1><p>مقاطع قصيرة من دروس وخطب الشيخ أشرف مازن.</p>`,
});
page({
  path: '/live',
  title: `البث المباشر - ${SITE_NAME}`,
  description: 'البث المباشر لدروس وخطب الشيخ أشرف مازن على قناته في يوتيوب، يظهر هنا وقت البث.',
  body: `${nav}<h1>البث المباشر</h1><p>يظهر هنا بث الشيخ أشرف مازن المباشر على يوتيوب وقت إذاعته.</p>`,
});
// Pages kept out of search results (their links are still followed); the app sets the same rule (useCanonical)
page({
  path: '/search',
  title: `البحث - ${SITE_NAME}`,
  description: 'ابحث في دروس الشيخ أشرف مازن وفيديوهاته وكتبه.',
  robots: 'noindex, follow',
  body: `${nav}<h1>البحث</h1>`,
});
page({
  path: '/contribute',
  title: `شارك - ${SITE_NAME}`,
  description: 'أرسل اقتراحاً أو تصحيحاً لموقع الشيخ أشرف مازن.',
  robots: 'noindex, follow',
  body: `${nav}<h1>شارك</h1>`,
});
// The Quran section (reciter and reader pages are not listed: they depend on an outside service)
page({
  path: '/quran',
  title: `القرآن الكريم: استماع وقراءة - موقع ${SITE_NAME}`,
  description: 'استمع إلى القرآن الكريم بأصوات القرّاء، واقرأ السورة مع الصوت، وإذاعات القرآن المباشرة.',
  crumbs: [{ name: 'القرآن الكريم', path: '/quran' }],
  body: `${nav}<h1>القرآن الكريم</h1><p>استمع إلى المصحف بأصوات القرّاء، أو إلى إذاعات القرآن المباشرة.</p>`,
});

// Categories and series
for (const category of categories) {
  if (!SAFE.test(category.slug)) continue;
  const inCategory = series.filter((s) => s.category_id === category.id);
  page({
    path: `/category/${category.slug}`,
    type: 'CollectionPage',
    title: `${category.name} - ${SITE_NAME}`,
    description: excerpt(category.description) || `دروس وسلاسل الشيخ أشرف مازن في ${category.name}.`,
    crumbs: [{ name: category.name, path: `/category/${category.slug}` }],
    body: `${nav}<h1>${esc(category.name)}</h1><p>${esc(category.description)}</p>
<h2>السلاسل</h2>${list(inCategory.map((s) => link(`/series/${s.slug}`, s.title)))}
<h2>الدروس</h2>${list(inCategory.flatMap((s) => lessonsBySeries.get(s.id) ?? []).map((l) => link(`/lesson/${l.id}`, l.title)))}`,
  });
}
for (const s of series) {
  if (!SAFE.test(s.slug)) continue;
  const category = categoryById.get(s.category_id);
  const items = lessonsBySeries.get(s.id) ?? [];
  page({
    path: `/series/${s.slug}`,
    type: 'CollectionPage',
    title: `${s.title} - ${SITE_NAME}`,
    description: excerpt(s.description) || `سلسلة «${s.title}» للشيخ أشرف مازن: ${items.length} درس.`,
    crumbs: [...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []), { name: s.title, path: `/series/${s.slug}` }],
    body: `${nav}<h1>${esc(s.title)}</h1>${category ? `<p>${link(`/category/${category.slug}`, category.name)}</p>` : ''}<p>${esc(s.description)}</p>
<h2>دروس السلسلة</h2><ol>${items.map((l) => `<li>${link(`/lesson/${l.id}`, l.title)}</li>`).join('')}</ol>`,
  });
}

// Lessons
for (const lesson of lessons) {
  if (!SAFE.test(lesson.id)) continue;
  const s = seriesById.get(lesson.series_id);
  const category = s && categoryById.get(s.category_id);
  const vid = youtubeId(lesson.youtube_url);
  const path = `/lesson/${lesson.id}`;
  const description =
    excerpt(lesson.transcript) || `${s ? `درس من سلسلة «${s.title}»` : 'درس'} للشيخ أشرف مازن${kind(lesson) ? ` (${kind(lesson)})` : ''}.`;
  const siblings = s ? lessonsBySeries.get(s.id) ?? [] : [];
  const date = lesson.published_at || lesson.created_at || undefined;
  const image = vid ? thumb(vid) : undefined;
  page({
    path,
    type: 'ItemPage',
    title: named(`${lesson.title}${s ? ` | ${s.title}` : ''}`),
    description,
    image,
    date,
    crumbs: [
      ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
      ...(s ? [{ name: s.title, path: `/series/${s.slug}` }] : []),
      { name: lesson.title, path },
    ],
    nodes: [
      vid && schema.videoObject({ id: vid, name: lesson.title, description, date, path }),
      lesson.transcript && schema.article({ path, title: lesson.title, text: description, date, image }),
    ],
    body: `${nav}<h1>${esc(lesson.title)}</h1>
<p>${[category && link(`/category/${category.slug}`, category.name), s && link(`/series/${s.slug}`, s.title)].filter(Boolean).join(' · ')}</p>
<p>${esc(kind(lesson))}</p>
${lesson.transcript ? `<article><h2>نص الدرس</h2><p>${esc(excerpt(lesson.transcript, 3000))}</p></article>` : ''}
${siblings.length > 1 ? `<h2>دروس السلسلة</h2><ol>${siblings.map((l) => `<li>${link(`/lesson/${l.id}`, l.title)}</li>`).join('')}</ol>` : ''}`,
  });
}

// Channel playlists and videos (a video in several playlists gets one page, under its first playlist).
// Titles drop the channel's hashtag tail (cleanVideoTitle); each video links to its neighbours in the series.
const lessonVideos = new Set(lessons.map((l) => youtubeId(l.youtube_url)).filter(Boolean));
const seenVideos = new Set();
for (const playlist of library) {
  if (!SAFE.test(playlist.id)) continue;
  const listTitle = cleanVideoTitle(playlist.title);
  const listPath = `/playlist/${playlist.id}`;
  page({
    path: listPath,
    type: 'CollectionPage',
    title: named(listTitle),
    description: `«${listTitle}»: ${playlist.videos.length} درس مرئي للشيخ أشرف مازن، مرتبة للمشاهدة بالترتيب.`,
    image: playlist.videos[0] ? thumb(playlist.videos[0].id) : undefined,
    crumbs: [{ name: 'المرئيات', path: '/videos' }, { name: listTitle, path: listPath }],
    body: `${nav}<h1>${esc(listTitle)}</h1><p>${playlist.videos.length} درس مرئي للشيخ أشرف مازن.</p><ol>${playlist.videos
      .map((v) => `<li>${link(`/video/${v.id}`, cleanVideoTitle(v.title))}</li>`)
      .join('')}</ol>`,
  });
  playlist.videos.forEach((video, i) => {
    if (seenVideos.has(video.id) || lessonVideos.has(video.id) || !SAFE.test(video.id)) return;
    seenVideos.add(video.id);
    const path = `/video/${video.id}`;
    const title = cleanVideoTitle(video.title);
    const description = videoDescription(video.title, playlist.title);
    const near = [playlist.videos[i - 1], playlist.videos[i + 1]].filter(Boolean);
    page({
      path,
      type: 'ItemPage',
      title: named(title),
      description,
      image: thumb(video.id),
      date: video.published,
      crumbs: [{ name: 'المرئيات', path: '/videos' }, { name: listTitle, path: listPath }, { name: title, path }],
      nodes: [schema.videoObject({ id: video.id, name: title, description, date: video.published, path })],
      body: `${nav}<h1>${esc(title)}</h1><p>درس مرئي للشيخ أشرف مازن من سلسلة ${link(listPath, listTitle)}.</p>
${near.length ? `<h2>الدرس السابق والتالي</h2>${list(near.map((v) => link(`/video/${v.id}`, cleanVideoTitle(v.title))))}` : ''}
<h2>من نفس السلسلة</h2>${list(playlist.videos.filter((v) => v.id !== video.id).slice(0, 20).map((v) => link(`/video/${v.id}`, cleanVideoTitle(v.title))))}`,
    });
  });
}

// Books
for (const book of books) {
  if (!SAFE.test(String(book.id))) continue;
  const path = `/book/${book.id}`;
  const description = excerpt(book.description) || `كتاب «${book.title}»${book.author ? ` - ${book.author}` : ''}، للقراءة والتحميل PDF.`;
  const image = /^https:\/\//.test(book.cover_url || '') ? book.cover_url : undefined;
  page({
    path,
    type: 'ItemPage',
    title: `${book.title} - المكتبة - ${SITE_NAME}`,
    description,
    image,
    crumbs: [{ name: 'المكتبة', path: '/books' }, { name: book.title, path }],
    nodes: [schema.book({ path, title: book.title, author: book.author, image })],
    body: `${nav}<h1>${esc(book.title)}</h1><p>${esc(book.author)}</p><p>${esc(book.description)}</p>`,
  });
}

console.log(`Prerendered ${written.count} pages into dist/ (plus app.html).`);
