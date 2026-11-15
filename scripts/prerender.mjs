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
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { excerpt, loadSiteData, root, siteUrl, youtubeId } from './site-data.mjs';
import { esc, render as renderPage, withNameFont, withSiteSeed } from './prerenderParts.mjs';
import { contentHash } from './contentHash.mjs';

const soft = process.argv.includes('--soft');
const dist = resolve(root, 'dist');
let template = readFileSync(resolve(dist, 'index.html'), 'utf8');

const SITE_NAME = 'الشيخ أشرف مازن';
const DEFAULT_DESCRIPTION =
  'الموقع الرسمي للشيخ أشرف مازن: دروس وشروحات وخطب ومحاضرات علمية مرئية ومسموعة ومكتوبة، ومكتبة كتب PDF.';


const site = { siteUrl, verification: '' };
// The first-visit copy goes only into the home page and app.html (`seeded`), never into every page
let seededTemplate = null;
const render = (page) => renderPage(page.seeded && seededTemplate ? seededTemplate : template, page, site);
const url = (path) => `${siteUrl}${encodeURI(path)}`;
// The sheikh's name once: many channel titles already carry it
const named = (text) => (/مازن/.test(text) ? text : `${text} - ${SITE_NAME}`);
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
writeFileSync(resolve(dist, 'app.html'), render({ path: '/', title: `${SITE_NAME} | دروس وخطب ومحاضرات علمية`, description: DEFAULT_DESCRIPTION, noCanonical: true, seeded: true }), 'utf8');

let data;
try {
  data = await loadSiteData();
  template = withNameFont(template, data.nameFont);
  seededTemplate = await withSiteSeed(template, async () => {
    const seedUrl = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    const { readSiteData } = await import('../api/site.ts');
    return readSiteData(seedUrl, process.env.VITE_SUPABASE_ANON_KEY || '');
  });
  // The fallback shell again, now with the chosen font
  writeFileSync(resolve(dist, 'app.html'), render({ path: '/', title: `${SITE_NAME} | دروس وخطب ومحاضرات علمية`, description: DEFAULT_DESCRIPTION, noCanonical: true, seeded: true }), 'utf8');
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

const person = {
  '@type': 'Person',
  '@id': `${siteUrl}/#person`,
  name: SITE_NAME,
  alternateName: ['أشرف مازن', 'أبو عبد الرحمن أشرف بن طه بن مازن', 'Sheikh Ashraf Mazen'],
  url: `${siteUrl}/`,
  jobTitle: 'داعية وطالب علم',
  sameAs: socials.map((s) => s.url).filter((u) => /^https:\/\//.test(u)),
};
const breadcrumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'الرئيسية', path: '/' }, ...items].map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: url(item.path),
  })),
});
const videoObject = ({ id, name, description, date, path }) =>
  date
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name,
        description: description || name,
        thumbnailUrl: thumb(id),
        uploadDate: date,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        url: url(path),
        inLanguage: 'ar',
        author: { '@id': `${siteUrl}/#person` },
      }
    : null;
const nav = `<nav><p>${[
  link('/', 'الرئيسية'),
  link('/videos', 'المرئيات'),
  link('/audio', 'الصوتيات'),
  link('/books', 'المكتبة'),
].join(' · ')}</p></nav>`;
const kind = (l) => [l.youtube_url && 'مرئي', l.audio_url && 'صوتي', l.transcript && 'مكتوب'].filter(Boolean).join('، ');

// Home
write({
  path: '/',
  title: `${SITE_NAME} | دروس وخطب ومحاضرات علمية`,
  description: DEFAULT_DESCRIPTION,
  schema: [{ '@context': 'https://schema.org', ...person }],
  body: `${nav}<h1>${SITE_NAME}</h1><p>${esc(DEFAULT_DESCRIPTION)}</p>
<h2>الأقسام</h2>${list(categories.map((c) => link(`/category/${c.slug}`, c.name)))}
<h2>السلاسل العلمية</h2>${list(series.map((s) => link(`/series/${s.slug}`, s.title)))}
<h2>أحدث الدروس</h2>${list(lessons.slice(0, 40).map((l) => link(`/lesson/${l.id}`, l.title)))}
<h2>قوائم فيديوهات القناة</h2>${list(library.map((p) => link(`/playlist/${p.id}`, p.title)))}`,
});

// Libraries
write({
  path: '/videos',
  title: `المرئيات - ${SITE_NAME}`,
  description: `دروس وخطب ومحاضرات الشيخ أشرف مازن المرئية، مرتبة في ${library.length} قائمة.`,
  body: `${nav}<h1>المرئيات</h1>${list(library.map((p) => `${link(`/playlist/${p.id}`, p.title)} (${p.videos.length} فيديو)`))}`,
});
const audioLessons = lessons.filter((l) => l.audio_url);
write({
  path: '/audio',
  title: `دروس صوتية - ${SITE_NAME}`,
  description: 'استمع إلى دروس الشيخ أشرف مازن الصوتية: شروح وخطب ومحاضرات.',
  body: `${nav}<h1>الصوتيات</h1>${list(audioLessons.map((l) => link(`/lesson/${l.id}`, l.title)))}`,
});
write({
  path: '/books',
  title: `المكتبة - ${SITE_NAME}`,
  description: 'مكتبة كتب ورسائل PDF للقراءة والتحميل من موقع الشيخ أشرف مازن.',
  body: `${nav}<h1>المكتبة</h1>${list(books.map((b) => link(`/book/${b.id}`, b.title)))}`,
});

// Categories and series
for (const category of categories) {
  if (!SAFE.test(category.slug)) continue;
  const inCategory = series.filter((s) => s.category_id === category.id);
  write({
    path: `/category/${category.slug}`,
    title: `${category.name} - ${SITE_NAME}`,
    description: excerpt(category.description) || `دروس وسلاسل الشيخ أشرف مازن في ${category.name}.`,
    schema: [breadcrumbs([{ name: category.name, path: `/category/${category.slug}` }])],
    body: `${nav}<h1>${esc(category.name)}</h1><p>${esc(category.description)}</p>
<h2>السلاسل</h2>${list(inCategory.map((s) => link(`/series/${s.slug}`, s.title)))}
<h2>الدروس</h2>${list(inCategory.flatMap((s) => lessonsBySeries.get(s.id) ?? []).map((l) => link(`/lesson/${l.id}`, l.title)))}`,
  });
}
for (const s of series) {
  if (!SAFE.test(s.slug)) continue;
  const category = categoryById.get(s.category_id);
  const items = lessonsBySeries.get(s.id) ?? [];
  write({
    path: `/series/${s.slug}`,
    title: `${s.title} - ${SITE_NAME}`,
    description: excerpt(s.description) || `سلسلة «${s.title}» للشيخ أشرف مازن: ${items.length} درس.`,
    schema: [
      breadcrumbs([
        ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
        { name: s.title, path: `/series/${s.slug}` },
      ]),
    ],
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
  write({
    path,
    title: named(`${lesson.title}${s ? ` | ${s.title}` : ''}`),
    description,
    image: vid ? thumb(vid) : undefined,
    schema: [
      breadcrumbs([
        ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
        ...(s ? [{ name: s.title, path: `/series/${s.slug}` }] : []),
        { name: lesson.title, path },
      ]),
      vid && videoObject({ id: vid, name: lesson.title, description, date: lesson.published_at || lesson.created_at, path }),
    ].filter(Boolean),
    body: `${nav}<h1>${esc(lesson.title)}</h1>
<p>${[category && link(`/category/${category.slug}`, category.name), s && link(`/series/${s.slug}`, s.title)].filter(Boolean).join(' · ')}</p>
<p>${esc(kind(lesson))}</p>
${lesson.transcript ? `<article><h2>نص الدرس</h2><p>${esc(excerpt(lesson.transcript, 3000))}</p></article>` : ''}
${siblings.length > 1 ? `<h2>دروس السلسلة</h2><ol>${siblings.map((l) => `<li>${link(`/lesson/${l.id}`, l.title)}</li>`).join('')}</ol>` : ''}`,
  });
}

// Channel playlists and videos (a video in several playlists gets one page, under its first playlist)
const lessonVideos = new Set(lessons.map((l) => youtubeId(l.youtube_url)).filter(Boolean));
const seenVideos = new Set();
for (const playlist of library) {
  if (!SAFE.test(playlist.id)) continue;
  write({
    path: `/playlist/${playlist.id}`,
    title: named(playlist.title),
    description: `${playlist.title}: ${playlist.videos.length} فيديو للشيخ أشرف مازن.`,
    image: playlist.videos[0] ? thumb(playlist.videos[0].id) : undefined,
    schema: [breadcrumbs([{ name: 'المرئيات', path: '/videos' }, { name: playlist.title, path: `/playlist/${playlist.id}` }])],
    body: `${nav}<h1>${esc(playlist.title)}</h1><ol>${playlist.videos.map((v) => `<li>${link(`/video/${v.id}`, v.title)}</li>`).join('')}</ol>`,
  });
  for (const video of playlist.videos) {
    if (seenVideos.has(video.id) || lessonVideos.has(video.id) || !SAFE.test(video.id)) continue;
    seenVideos.add(video.id);
    const path = `/video/${video.id}`;
    const description = `${video.title} - من «${playlist.title}» للشيخ أشرف مازن.`;
    write({
      path,
      title: named(video.title),
      description,
      image: thumb(video.id),
      schema: [
        breadcrumbs([
          { name: 'المرئيات', path: '/videos' },
          { name: playlist.title, path: `/playlist/${playlist.id}` },
          { name: video.title, path },
        ]),
        videoObject({ id: video.id, name: video.title, description, date: video.published, path }),
      ].filter(Boolean),
      body: `${nav}<h1>${esc(video.title)}</h1><p>${link(`/playlist/${playlist.id}`, playlist.title)}</p>
<h2>من نفس القائمة</h2>${list(playlist.videos.filter((v) => v.id !== video.id).slice(0, 20).map((v) => link(`/video/${v.id}`, v.title)))}`,
    });
  }
}

// Books
for (const book of books) {
  if (!SAFE.test(String(book.id))) continue;
  const path = `/book/${book.id}`;
  const description = excerpt(book.description) || `كتاب «${book.title}»${book.author ? ` - ${book.author}` : ''}، للقراءة والتحميل PDF.`;
  write({
    path,
    title: `${book.title} - المكتبة - ${SITE_NAME}`,
    description,
    image: /^https:\/\//.test(book.cover_url || '') ? book.cover_url : undefined,
    schema: [
      breadcrumbs([{ name: 'المكتبة', path: '/books' }, { name: book.title, path }]),
      { '@context': 'https://schema.org', '@type': 'Book', name: book.title, author: book.author ? { '@type': 'Person', name: book.author } : undefined, url: url(path), inLanguage: 'ar' },
    ],
    body: `${nav}<h1>${esc(book.title)}</h1><p>${esc(book.author)}</p><p>${esc(book.description)}</p>`,
  });
}

console.log(`Prerendered ${written.count} pages into dist/ (plus app.html).`);
