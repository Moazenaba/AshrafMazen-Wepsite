// Vercel serverless function: the whole video library, served from the backend.
// The saved library (src/data/youtube-library.ts) is the base. Once an hour this function asks YouTube for each
// playlist's newest videos, merges any new ones in, and keeps the result. YouTube's RSS feeds are asked first; they
// answer 404 now, so the playlist's own page is read then (api/_youtubePage.ts). The channel's uploads that are in
// no playlist are listed under «أحدث فيديوهات القناة». Visitors get the stored copy with CDN caching.
import { YOUTUBE_LIBRARY, type LibraryPlaylist, type LibraryVideo } from '../src/data/youtube-library.js'; // Node on Vercel needs the extension
import { parseVideos } from './_youtubePage.js';

const TTL_MS = 60 * 60 * 1000;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';
// The list of the channel's uploads that are in no playlist
const LATEST_ID = 'channel-latest';
const PAGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'Accept-Language': 'ar,en;q=0.8',
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
};
// One stored library per set of admin-added playlists: adding or removing one builds a new library at once
// instead of waiting for the 6 hours to pass. The site asks with ?p=<those playlist ids>, so the CDN copy changes too.
const cache = new Map<string, { at: number; body: string }>();

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

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, { headers: PAGE_HEADERS });
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

// How the playlists' videos were had in the last build, for the log (rss = the feed, page = the playlist's page)
const via = { rss: 0, page: 0, none: 0 };

async function fetchNewest(playlistId: string): Promise<LibraryVideo[]> {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
    if (response.ok) {
      const videos = parseFeed(await response.text());
      if (videos.length > 0) {
        via.rss++;
        return videos;
      }
    }
  } catch {
    // the feed is unreachable: the page is tried
  }
  const page = parseVideos(await fetchPage(`https://www.youtube.com/playlist?list=${playlistId}`));
  if (page.length === 0) {
    via.none++;
    return [];
  }
  via.page++;
  // The page has no dates: a video new to the library is dated by the time it was first seen
  const seen = new Date().toISOString();
  return page.map((v) => ({ id: v.id, title: v.title, published: seen }));
}

// The channel's latest uploads that no playlist holds (a video just uploaded, not yet put in a playlist)
async function channelLatest(known: Set<string>): Promise<LibraryPlaylist | null> {
  const seen = new Date().toISOString();
  const videos = parseVideos(await fetchPage(`https://www.youtube.com/channel/${CHANNEL_ID}/videos`))
    .filter((v) => !known.has(v.id))
    .map((v) => ({ id: v.id, title: v.title, published: seen }));
  return videos.length === 0 ? null : { id: LATEST_ID, title: 'أحدث فيديوهات القناة', count: `${videos.length} فيديو`, latestVideoId: videos[0].id, videos };
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

async function build(extras: { id: string; title: string }[]): Promise<string> {
  via.rss = via.page = via.none = 0;
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
  const playlists = [...merge(YOUTUBE_LIBRARY, newest), ...addedPlaylists];
  const latest = await channelLatest(new Set(playlists.flatMap((p) => p.videos.map((v) => v.id))));
  console.log(`youtube-library built: ${playlists.length} playlists; videos via feed ${via.rss}, via page ${via.page}, none ${via.none}; uploads in no playlist ${latest?.videos.length ?? 0}`);
  return JSON.stringify({ updatedAt: new Date().toISOString(), playlists: latest ? [latest, ...playlists] : playlists });
}

export default async function handler(req: any, res: any) {
  const known = new Set(YOUTUBE_LIBRARY.map((p) => p.id));
  const extras = (await extraPlaylists()).filter((p) => !known.has(p.id));
  const signature = extras.map((p) => `${p.id}:${p.title}`).sort().join('|');
  let entry = cache.get(signature);
  if (!entry || Date.now() - entry.at > TTL_MS) {
    try {
      entry = { at: Date.now(), body: await build(extras) };
      if (cache.size > 20) cache.clear();
      cache.set(signature, entry);
    } catch {
      // Keep the copy we already have; if there is none, the site shows its saved library
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
  res.status(200).send(entry?.body ?? JSON.stringify({ updatedAt: null, playlists: YOUTUBE_LIBRARY }));
}
