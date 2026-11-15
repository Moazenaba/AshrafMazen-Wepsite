// Vercel serverless function: the channel's newest YouTube Shorts, for the site's reels page.
// Every 6 hours (TTL_MS; every 10 minutes while the list is empty) it reads the channel's Shorts page (YouTube's RSS feeds answer 404 from servers) and keeps the result; visitors get
// the stored copy with CDN caching. What the admin hid, ordered or added is applied in the browser
// (src/lib/reels.ts), so a saved change shows at once without waiting for this list.
import { parseShortsPage, type ShortItem } from './_shorts.js'; // Node on Vercel needs the extension
import { fetchWithTimeout } from './_fetch.js'; // Node on Vercel needs the extension
import { withArabic, YOUTUBE_HEADERS } from './_youtubePage.js';
import { logEvent } from './_log.js'; // Node on Vercel needs the extension

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';
const TTL_MS = 6 * 60 * 60 * 1000;
const EMPTY_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; body: string; empty: boolean } | null = null;

async function text(url: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(url.includes('youtube.com/oembed') ? url : withArabic(url), { headers: YOUTUBE_HEADERS });
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

async function build(): Promise<string> {
  const page = await text(`https://www.youtube.com/channel/${CHANNEL_ID}/shorts`);
  const found: ShortItem[] = parseShortsPage(page).slice(0, 60);
  // The Shorts page often shows a date or a view count instead of the title; YouTube's oEmbed gives the real one
  const shorts = await Promise.all(
    found.map(async (item) => {
      const data = await text(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/shorts/${item.id}`)}`);
      try {
        const title = JSON.parse(data || '{}').title;
        return typeof title === 'string' && title.trim() ? { ...item, title: title.trim() } : item;
      } catch {
        return item;
      }
    })
  );
  return JSON.stringify({ updatedAt: new Date().toISOString(), shorts });
}

export default async function handler(_req: any, res: any) {
  if (!cache || Date.now() - cache.at > (cache.empty ? EMPTY_TTL_MS : TTL_MS)) {
    try {
      const body = await build();
      const empty = JSON.parse(body).shorts.length === 0;
      // An empty answer (YouTube unreachable for a moment) never replaces a list we have, and is retried soon
      if (!cache || cache.empty || !empty) cache = { at: Date.now(), body, empty };
      else cache = { ...cache, at: Date.now() - TTL_MS + EMPTY_TTL_MS };
      if (empty) await logEvent('error', 'youtube-shorts', 'no shorts read');
    } catch (err) {
      // keep what we have
      await logEvent('error', 'youtube-shorts', 'shorts build failed', { reason: err instanceof Error ? err.message : String(err) });
    }
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.status(200).send(cache?.body ?? JSON.stringify({ updatedAt: null, shorts: [] }));
}
