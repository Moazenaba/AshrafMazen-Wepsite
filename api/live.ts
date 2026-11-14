// Vercel serverless function: is the Sheikh's own YouTube channel broadcasting live right now?
// It answers { live: false } or { live: true, videoId, title }. Only this channel counts: a live of any other channel
// (or an ended or upcoming one) never shows. The site's banner and /live page read it, so nobody has to switch anything on.
// The answer is kept by the CDN for a minute, so YouTube is asked about once a minute however many visitors there are.
import { parseLiveNow } from './_youtubeLive.js'; // Node on Vercel needs the extension
import { withArabic, YOUTUBE_HEADERS } from './_youtubePage.js';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';

export default async function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    // Follows the redirect to the live broadcast's page when there is one (the Arabic page, for the Arabic title)
    const response = await fetch(withArabic(`https://www.youtube.com/channel/${CHANNEL_ID}/live`), { headers: YOUTUBE_HEADERS, redirect: 'follow' });
    const live = response.ok ? parseLiveNow(await response.text(), CHANNEL_ID) : null;
    // A minute fresh, then one more minute served while the next answer is fetched
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
    return res.status(200).send(JSON.stringify(live ? { live: true, ...live } : { live: false }));
  } catch (err) {
    console.error('api/live:', err);
    // When YouTube cannot be reached the site simply shows no broadcast; asked again in half a minute
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
    return res.status(200).send(JSON.stringify({ live: false }));
  }
}
