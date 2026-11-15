// Vercel serverless function: the whole video library, served from the backend.
// The saved library (src/data/youtube-library.ts) is the base; the GitHub job .github/workflows/sync-youtube.yml adds new
// videos to it every 30 minutes, so this function no longer re-reads every playlist. Once an hour it asks YouTube only
// for what that file cannot have yet: the channel's newest uploads (listed under «أحدث فيديوهات القناة» until they are in a
// saved playlist), a playlist made on the channel since the last sync, and the playlists the admin added. That is 2-3
// requests to YouTube instead of about 30, and YouTube's RSS feeds are not asked at all (they answer 403/404 most of the
// time from servers, which filled the logs with errors). The playlist pages are read with api/_youtubePage.ts.
// (What the admin hid or removed is taken off on the site afterwards, so none of this brings it back.)
import { YOUTUBE_LIBRARY, type LibraryPlaylist, type LibraryVideo } from '../src/data/youtube-library.js'; // Node on Vercel needs the extension
import { parsePlaylists, parseVideos, withArabic, YOUTUBE_HEADERS } from './_youtubePage.js';
import { fetchWithTimeout } from './_fetch.js'; // Node on Vercel needs the extension
import { logEvent } from './_log.js'; // Node on Vercel needs the extension

const TTL_MS = 60 * 60 * 1000;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';
// The list of the channel's uploads that are in no playlist
const LATEST_ID = 'channel-latest';
// One stored library per set of admin-added playlists: adding or removing one builds a new library at once
// instead of waiting for the 6 hours to pass. The site asks with ?p=<those playlist ids>, so the CDN copy changes too.
const cache = new Map<string, { at: number; body: string }>();

async function fetchPage(url: string): Promise<string> {
  try {
    // Always the Arabic page: from a US server YouTube would otherwise send its English translation of the titles
    const response = await fetchWithTimeout(withArabic(url), { headers: YOUTUBE_HEADERS });
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

// How many playlist pages answered in the last build, for the log
const via = { page: 0, none: 0 };

// A playlist's videos from its own page (newest first)
async function fetchNewest(playlistId: string): Promise<LibraryVideo[]> {
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

// The admin's saved settings (site_settings "youtube_overrides"), {} when there are none or they cannot be read
export async function loadOverrides(): Promise<Record<string, any>> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) return {};
  try {
    const response = await fetchWithTimeout(`${url}/rest/v1/site_settings?select=value&key=eq.youtube_overrides`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return {};
    const rows = (await response.json()) as { value?: string }[];
    const parsed = JSON.parse(rows[0]?.value || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

// Playlists the admin added from the admin screen (their newest videos come from YouTube like the others')
async function extraPlaylists(): Promise<{ id: string; title: string }[]> {
  const list = (await loadOverrides()).extraPlaylists;
  return (Array.isArray(list) ? list : []).filter((p: any) => /^[A-Za-z0-9_-]{10,60}$/.test(p?.id) && typeof p?.title === 'string').slice(0, 30);
}

// Playlists on the channel that neither the saved library nor the admin has: they are added by themselves
async function discoverPlaylists(known: Set<string>): Promise<{ id: string; title: string }[]> {
  const found = parsePlaylists(await fetchPage(`https://www.youtube.com/channel/${CHANNEL_ID}/playlists`));
  return found.filter((p) => !known.has(p.id)).slice(0, 30);
}

async function build(admins: { id: string; title: string }[]): Promise<string> {
  via.page = via.none = 0;
  const discovered = await discoverPlaylists(new Set([...YOUTUBE_LIBRARY.map((p) => p.id), ...admins.map((p) => p.id)]));
  const extras = [...admins, ...discovered];
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
  // The saved playlists are taken as they are: the GitHub job keeps them current
  const playlists = [...YOUTUBE_LIBRARY, ...addedPlaylists];
  const latest = await channelLatest(new Set(playlists.flatMap((p) => p.videos.map((v) => v.id))));
  void logEvent('info', 'youtube-library', `built: ${playlists.length} playlists (${discovered.length} found on the channel by themselves, ${admins.length} added by the admin); extra playlist pages read ${via.page}, empty ${via.none}; uploads in no playlist ${latest?.videos.length ?? 0}`);
  return JSON.stringify({ updatedAt: new Date().toISOString(), playlists: latest ? [latest, ...playlists] : playlists });
}

// The library as JSON text: the stored copy, rebuilt when it is older than TTL_MS
export async function loadLibrary(): Promise<string> {
  const known = new Set(YOUTUBE_LIBRARY.map((p) => p.id));
  const extras = (await extraPlaylists()).filter((p) => !known.has(p.id));
  const signature = extras.map((p) => `${p.id}:${p.title}`).sort().join('|');
  let entry = cache.get(signature);
  if (!entry || Date.now() - entry.at > TTL_MS) {
    try {
      entry = { at: Date.now(), body: await build(extras) };
      if (cache.size > 20) cache.clear();
      cache.set(signature, entry);
    } catch (err) {
      // Keep the copy we already have; if there is none, the site shows its saved library
      await logEvent('error', 'youtube-library', 'library build failed', { reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return entry?.body ?? JSON.stringify({ updatedAt: null, playlists: YOUTUBE_LIBRARY });
}

export default async function handler(req: any, res: any) {
  const body = await loadLibrary();
  res.setHeader('Content-Type', 'application/json');
  // max-age: a browser reuses the answer for five minutes without asking again (it used to ask on every page and get
  // "304 not modified" each time); the CDN keeps it an hour. The admin's own changes do not depend on this answer.
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=21600');
  res.status(200).send(body);
}
