// Vercel serverless function: the whole video library, served from the backend.
// The saved library (src/data/youtube-library.ts) is the base. Once every 6 hours this function asks
// YouTube's RSS feeds for each playlist's newest videos, merges any new ones in, and keeps the result.
// Visitors get the stored copy with CDN caching, so YouTube and the server see almost no load.
import { YOUTUBE_LIBRARY, type LibraryPlaylist, type LibraryVideo } from '../src/data/youtube-library';

const TTL_MS = 6 * 60 * 60 * 1000;
let cache: { at: number; body: string } | null = null;

const decode = (text: string) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const parseFeed = (xml: string): LibraryVideo[] =>
  [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, entry]) => ({
      id: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? '',
      title: decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').trim(),
      published: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '',
    }))
    .filter((video) => video.id && video.title);

async function fetchNewest(playlistId: string): Promise<LibraryVideo[]> {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
    return response.ok ? parseFeed(await response.text()) : [];
  } catch {
    return [];
  }
}

// Newest videos go to the top of each playlist; videos already in the library are not repeated
function merge(base: LibraryPlaylist[], newest: Map<string, LibraryVideo[]>): LibraryPlaylist[] {
  return base.map((playlist) => {
    const known = new Set(playlist.videos.map((v) => v.id));
    const added = (newest.get(playlist.id) ?? []).filter((v) => !known.has(v.id));
    return added.length === 0 ? playlist : { ...playlist, videos: [...added, ...playlist.videos] };
  });
}

// Playlists the admin added from the admin screen (kept in site_settings, "youtube_overrides"). Their newest videos
// come from the same RSS feed, so a new playlist shows up without changing any code.
async function extraPlaylists(): Promise<{ id: string; title: string }[]> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) return [];
  try {
    const response = await fetch(`${url}/rest/v1/site_settings?select=value&key=eq.youtube_overrides`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as { value?: string }[];
    const parsed = JSON.parse(rows[0]?.value || '{}');
    const list = Array.isArray(parsed.extraPlaylists) ? parsed.extraPlaylists : [];
    return list.filter((p: any) => /^[A-Za-z0-9_-]{10,60}$/.test(p?.id) && typeof p?.title === 'string').slice(0, 30);
  } catch {
    return [];
  }
}

async function build(): Promise<string> {
  const known = new Set(YOUTUBE_LIBRARY.map((p) => p.id));
  const extras = (await extraPlaylists()).filter((p) => !known.has(p.id));
  const extraVideos = new Map<string, LibraryVideo[]>();
  await Promise.all(
    extras.map(async (playlist) => {
      extraVideos.set(playlist.id, await fetchNewest(playlist.id));
    })
  );
  const addedPlaylists: LibraryPlaylist[] = extras
    .map((p) => ({
      id: p.id,
      title: p.title,
      count: `${(extraVideos.get(p.id) ?? []).length} فيديو`,
      latestVideoId: extraVideos.get(p.id)?.[0]?.id ?? '',
      videos: extraVideos.get(p.id) ?? [],
    }))
    .filter((p) => p.videos.length > 0);
  const newest = new Map<string, LibraryVideo[]>();
  await Promise.all(
    YOUTUBE_LIBRARY.map(async (playlist) => {
      newest.set(playlist.id, await fetchNewest(playlist.id));
    })
  );
  return JSON.stringify({ updatedAt: new Date().toISOString(), playlists: [...merge(YOUTUBE_LIBRARY, newest), ...addedPlaylists] });
}

export default async function handler(req: any, res: any) {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    try {
      cache = { at: Date.now(), body: await build() };
    } catch {
      // Keep the copy we already have; if there is none, the site shows its saved library
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.status(200).send(cache?.body ?? JSON.stringify({ updatedAt: null, playlists: YOUTUBE_LIBRARY }));
}
