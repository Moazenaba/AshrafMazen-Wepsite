// Writes public/sitemap.xml and public/robots.txt for the whole site: the pages, the categories, series and
// lessons, the channel's playlists and videos, and the library's books.
//
//   npm run sitemap          writes the files, and fails loudly if anything is missing
//   node scripts/generate-sitemap.mjs --soft   used by `npm run build`: a problem here (no network, no keys) is a
//                                              warning, so it can never stop the site from building
//
// Settings come from the environment or from .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and
// SITE_URL (the public address; defaults to https://ashrafmazen.com).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { excerpt, loadSiteData, root, siteUrl, youtubeId } from './site-data.mjs';
import { cleanVideoTitle, videoDescription } from '../src/lib/seoText.ts';
import { llmsText } from './llms.mjs';

const soft = process.argv.includes('--soft');

let data;
try {
  data = await loadSiteData();
} catch (err) {
  if (soft) {
    console.warn(`::warning::sitemap skipped: ${err.message}`);
    process.exit(0);
  }
  console.error(`Could not read the site's data: ${err.message}`);
  process.exit(1);
}
const { categories, series, lessons, books, library } = data;

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urls = [];
const pushUrl = (path, extra = '') => urls.push(`  <url>\n    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>${extra}\n  </url>`);
const videoEntry = ({ id, title, description, date }) => `
    <video:video>
      <video:thumbnail_loc>${escapeXml(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}</video:thumbnail_loc>
      <video:title>${escapeXml(cleanVideoTitle(title))}</video:title>
      <video:description>${escapeXml(description || title)}</video:description>
      <video:player_loc>${escapeXml(`https://www.youtube-nocookie.com/embed/${id}`)}</video:player_loc>
      ${date ? `<video:publication_date>${escapeXml(date)}</video:publication_date>` : ''}
    </video:video>`;

// lastmod only where a real date is known: the newest lesson for the lists that show lessons
const day = (d) => (d ? String(d).slice(0, 10) : '');
const lastmodTag = (d) => (day(d) ? `\n    <lastmod>${day(d)}</lastmod>` : '');
const newest = (items) => items.map((l) => l.published_at || l.created_at).filter(Boolean).sort().at(-1);
pushUrl('/', lastmodTag(newest(lessons)));
['/videos', '/reels', '/quran'].forEach((path) => pushUrl(path));
pushUrl('/audio', lastmodTag(newest(lessons.filter((l) => l.audio_url))));
pushUrl('/books', lastmodTag(books.map((b) => b.published_at).filter(Boolean).sort().at(-1)));
const seriesIdsOf = (categoryId) => new Set(series.filter((s) => s.category_id === categoryId).map((s) => s.id));
categories.forEach((c) => pushUrl(`/category/${encodeURIComponent(c.slug)}`, lastmodTag(newest(lessons.filter((l) => seriesIdsOf(c.id).has(l.series_id))))));
series.forEach((s) => pushUrl(`/series/${encodeURIComponent(s.slug)}`, lastmodTag(newest(lessons.filter((l) => l.series_id === s.id)))));

const seenVideos = new Set();
lessons.forEach((lesson) => {
  const lastmod = (lesson.published_at || lesson.created_at || '').slice(0, 10);
  const lastmodXml = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  const id = youtubeId(lesson.youtube_url);
  if (id) seenVideos.add(id);
  pushUrl(
    `/lesson/${lesson.id}`,
    `${lastmodXml}${id ? videoEntry({ id, title: lesson.title, description: excerpt(lesson.transcript), date: lesson.published_at }) : ''}`
  );
});

let channelVideos = 0;
library.forEach((playlist) => {
  pushUrl(`/playlist/${playlist.id}`);
  playlist.videos.forEach((video) => {
    if (seenVideos.has(video.id)) return;
    seenVideos.add(video.id);
    channelVideos += 1;
    pushUrl(
      `/video/${video.id}`,
      `${lastmodTag(video.published)}${videoEntry({ id: video.id, title: video.title, description: videoDescription(video.title, playlist.title), date: video.published })}`
    );
  });
});

books.forEach((book) => pushUrl(`/book/${book.id}`, book.published_at ? `\n    <lastmod>${String(book.published_at).slice(0, 10)}</lastmod>` : ''));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`;

mkdirSync(resolve(root, 'public'), { recursive: true });
writeFileSync(resolve(root, 'public', 'sitemap.xml'), xml, 'utf8');
writeFileSync(
  resolve(root, 'public', 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /bookmarks\nDisallow: /dev/\n\nSitemap: ${siteUrl}/sitemap.xml\nSitemap: ${siteUrl}/sitemap-videos.xml\n`,
  'utf8'
);
writeFileSync(resolve(root, 'public', 'llms.txt'), llmsText({ siteUrl, categories, series, library, lessons, books }), 'utf8');

console.log(`Sitemap written: ${urls.length} URLs (${lessons.length} lessons, ${channelVideos} channel videos, ${books.length} books).`);
