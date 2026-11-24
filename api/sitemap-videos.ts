// Vercel serverless function: /sitemap-videos.xml (a rewrite in vercel.json), the channel's playlists and videos as
// the site shows them now, found again every hour, without what the admin hid or removed.
import { YOUTUBE_LIBRARY } from '../src/data/youtube-library.js'; // Node on Vercel needs the extension
import { applyOverrides } from '../src/lib/libraryOverrides.js';
import { loadLibrary, loadOverrides } from './youtube-library.js';
import { normalizeOverrides, videosSitemap } from './_sitemapVideos.js';

const SITE_URL = (process.env.SITE_URL || 'https://ashrafmazen.com').replace(/\/+$/, '');
// A video's true publication date, when the saved library has it
const dates = new Map(YOUTUBE_LIBRARY.flatMap((p) => p.videos.map((v) => [v.id, v.published] as const)));

export default async function handler(req: any, res: any) {
  const library = JSON.parse(await loadLibrary()).playlists as Parameters<typeof applyOverrides>[0];
  const shown = applyOverrides(library, normalizeOverrides(await loadOverrides()));
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
  res.status(200).send(videosSitemap(shown, SITE_URL, (id) => dates.get(id)));
}
