// Writes public/sitemap.xml and public/robots.txt for the whole site: the pages, the categories, series and
// lessons, the channel's playlists and videos, and the library's books.
//
//   npm run sitemap          writes the files, and fails loudly if anything is missing
//   node scripts/generate-sitemap.mjs --soft   used by `npm run build`: a problem here (no network, no keys) is a
//                                              warning, so it can never stop the site from building
//
// Settings come from the environment or from .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and
// SITE_URL (the public address; defaults to https://sheikh-mazen.org).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const soft = process.argv.includes('--soft');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// A few lines instead of a dependency: KEY=value lines of .env.local, without overriding the real environment
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const fail = (message) => {
  if (soft) {
    console.warn(`sitemap skipped: ${message}`);
    process.exit(0);
  }
  console.error(message);
  process.exit(1);
};

const siteUrl = (process.env.SITE_URL || 'https://sheikh-mazen.org').replace(/\/$/, '');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey) fail('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (set them in the environment or .env.local).');

const supabase = createClient(supabaseUrl, anonKey);

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const ID_IN_URL = /(?:youtu\.be\/|[?&]v=|youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/;
const youtubeId = (url) => {
  if (!url) return null;
  const clean = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(ID_IN_URL);
  return match ? match[1] : null;
};

const excerpt = (text, max = 160) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
};

const fetchAll = async (table, columns, filter) => {
  let query = supabase.from(table).select(columns);
  if (filter) query = filter(query);
  const { data, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
};

// The bundled channel library (src/data/youtube-library.ts is generated JSON after its type declarations)
function readChannelLibrary() {
  try {
    const source = readFileSync(resolve(root, 'src/data/youtube-library.ts'), 'utf8');
    const start = source.indexOf('= [', source.indexOf('export const YOUTUBE_LIBRARY'));
    const end = source.lastIndexOf('];');
    return JSON.parse(source.slice(start + 2, end + 1));
  } catch (err) {
    console.warn('channel library not read:', err.message);
    return [];
  }
}

// The books list is one JSON record in site_settings (see dataService.ts)
async function readBooks() {
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'library_books').maybeSingle();
  try {
    const list = JSON.parse(data?.value || '[]');
    return Array.isArray(list) ? list.filter((b) => b.status === 'published') : [];
  } catch {
    return [];
  }
}

// The admin can hide channel playlists and videos; hidden ones are kept out of the sitemap too
async function readHidden() {
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'youtube_overrides').maybeSingle();
  try {
    const parsed = JSON.parse(data?.value || '{}');
    return { playlists: new Set(parsed.hiddenPlaylists || []), videos: new Set(parsed.hiddenVideos || []) };
  } catch {
    return { playlists: new Set(), videos: new Set() };
  }
}

let categories, series, lessons, books, hidden;
try {
  [categories, series, lessons, books, hidden] = await Promise.all([
    fetchAll('categories', 'slug'),
    fetchAll('series', 'slug'),
    fetchAll('lessons', 'id,title,youtube_url,audio_url,transcript,published_at,created_at', (q) => q.eq('status', 'published')),
    readBooks(),
    readHidden(),
  ]);
} catch (err) {
  fail(`Could not read the site's data: ${err.message}`);
}

const urls = [];
const pushUrl = (path, extra = '') => urls.push(`  <url>\n    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>${extra}\n  </url>`);
const videoEntry = ({ id, title, description, date }) => `
    <video:video>
      <video:thumbnail_loc>${escapeXml(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(description || title)}</video:description>
      <video:player_loc>${escapeXml(`https://www.youtube-nocookie.com/embed/${id}`)}</video:player_loc>
      ${date ? `<video:publication_date>${escapeXml(date)}</video:publication_date>` : ''}
    </video:video>`;

['/', '/videos', '/audio', '/books', '/search'].forEach((path) => pushUrl(path));
categories.forEach((c) => pushUrl(`/category/${encodeURIComponent(c.slug)}`));
series.forEach((s) => pushUrl(`/series/${encodeURIComponent(s.slug)}`));

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
readChannelLibrary().forEach((playlist) => {
  if (hidden.playlists.has(playlist.id)) return;
  pushUrl(`/playlist/${playlist.id}`);
  playlist.videos.forEach((video) => {
    if (hidden.videos.has(video.id) || seenVideos.has(video.id)) return;
    seenVideos.add(video.id);
    channelVideos += 1;
    pushUrl(
      `/video/${video.id}`,
      `${video.published ? `\n    <lastmod>${String(video.published).slice(0, 10)}</lastmod>` : ''}${videoEntry({ id: video.id, title: video.title, date: video.published })}`
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
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  'utf8'
);

console.log(`Sitemap written: ${urls.length} URLs (${lessons.length} lessons, ${channelVideos} channel videos, ${books.length} books).`);
