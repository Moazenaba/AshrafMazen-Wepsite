// The site's public content, read once at build time for the sitemap (generate-sitemap.mjs) and the
// prerendered pages (prerender.mjs): categories, series, published lessons, books, the channel library,
// what the admin hid, and the sheikh's social links.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// A few lines instead of a dependency: KEY=value lines of .env.local, without overriding the real environment
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

// The one public address of the site; every canonical link and sitemap entry uses it
export const siteUrl = (process.env.SITE_URL || 'https://ashraf-mazen.vercel.app').replace(/\/$/, '');

const ID_IN_URL = /(?:youtu\.be\/|[?&]v=|youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/;
export const youtubeId = (url) => {
  if (!url) return null;
  const clean = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(ID_IN_URL);
  return match ? match[1] : null;
};

export const excerpt = (text, max = 160) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
};

// The bundled channel library (src/data/youtube-library.ts is generated JSON after its type declarations)
export function readChannelLibrary() {
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

// Throws when the database cannot be reached; callers decide whether that stops the build
export async function loadSiteData() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (set them in the environment or .env.local).');
  const supabase = createClient(supabaseUrl, anonKey);

  const fetchAll = async (table, columns, filter) => {
    let query = supabase.from(table).select(columns);
    if (filter) query = filter(query);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    return data ?? [];
  };

  // Published books only, through the function visitors use (the record itself is admin-only after the security migration)
  const readBooks = async () => {
    const published = await supabase.rpc('published_books');
    if (!published.error) return Array.isArray(published.data) ? published.data : [];
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'library_books').maybeSingle();
    try {
      const list = JSON.parse(data?.value || '[]');
      return Array.isArray(list) ? list.filter((b) => b.status === 'published') : [];
    } catch {
      return [];
    }
  };

  // The admin can hide channel playlists and videos, and rename them
  const readOverrides = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'youtube_overrides').maybeSingle();
    try {
      const parsed = JSON.parse(data?.value || '{}');
      return {
        playlists: new Set(parsed.hiddenPlaylists || []),
        videos: new Set(parsed.hiddenVideos || []),
        videoTitles: parsed.videoTitles || {},
        playlistTitles: parsed.playlistTitles || {},
      };
    } catch {
      return { playlists: new Set(), videos: new Set(), videoTitles: {}, playlistTitles: {} };
    }
  };

  const [categories, series, lessons, books, hidden, socials, nameFont] = await Promise.all([
    fetchAll('categories', 'id,slug,name,description,sort_order', (q) => q.order('sort_order', { ascending: true })),
    fetchAll('series', 'id,slug,title,description,category_id,sort_order', (q) => q.order('sort_order', { ascending: true })),
    fetchAll('lessons', 'id,title,series_id,lesson_number,youtube_url,audio_url,transcript,published_at,created_at', (q) =>
      q.eq('status', 'published').order('published_at', { ascending: false })
    ),
    readBooks(),
    readOverrides(),
    fetchAll('social_links', 'platform,url', (q) => q.eq('is_active', true)).catch(() => []),
    // The font the admin chose for the sheikh's name
    supabase.from('site_settings').select('value').eq('key', 'banner_font').maybeSingle().then(({ data }) => data?.value || '', () => ''),
  ]);

  // The channel's playlists and videos as visitors see them: without the hidden ones, with the admin's titles
  const library = readChannelLibrary()
    .filter((p) => !hidden.playlists.has(p.id))
    .map((p) => ({
      ...p,
      title: hidden.playlistTitles[p.id] || p.title,
      videos: p.videos.filter((v) => !hidden.videos.has(v.id)).map((v) => ({ ...v, title: hidden.videoTitles[v.id] || v.title })),
    }))
    .filter((p) => p.videos.length > 0);

  return { categories, series, lessons, books, hidden, socials, library, nameFont };
}
