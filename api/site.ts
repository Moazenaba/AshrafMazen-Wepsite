// Vercel serverless function: everything the public pages need on first load, in one answer the CDN keeps.
// Before this, every visitor's browser asked Supabase ~15 separate questions (settings, sciences, series, lessons,
// social links), several of them one after another. Now the browser asks once (index.html preloads it), the CDN
// answers in milliseconds, and Supabase sees about one request a minute. Reads only what visitors may read (anon key).

// Public site_settings rows the shell and the home page show (the table also holds large records that stay out)
export const SETTING_KEYS = [
  'banner_name',
  'banner_logo_url',
  'about_sheikh',
  'banner_font',
  'ticker_quotes',
  'hero_quote',
  'contact_info',
  'home_feature',
  'side_menu',
  'welcome_sound',
  'live_stream',
  'lesson_extras',
];

const QUERIES = {
  settings: `site_settings?select=key,value&key=in.(${SETTING_KEYS.join(',')})`,
  categories: 'categories?select=*&order=sort_order.asc',
  series: 'series?select=*&order=sort_order.asc',
  lessons: 'lessons?select=*&status=eq.published&order=published_at.desc',
  social: 'social_links?select=*&is_active=eq.true&order=sort_order.asc',
} as const;

// Gives up after 8 s. Written here instead of importing api/_fetch.ts because scripts/prerender.mjs loads this file
// directly with Node, which cannot resolve the ".js" import that Vercel needs.
const timedGet: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) });

export async function readSiteData(url: string, key: string, fetcher: typeof fetch = timedGet) {
  const entries = await Promise.all(
    Object.entries(QUERIES).map(async ([name, query]) => {
      const response = await fetcher(`${url}/rest/v1/${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (!response.ok) throw new Error(`${name}: ${response.status}`);
      return [name, await response.json()] as const;
    })
  );
  return { updatedAt: new Date().toISOString(), ...Object.fromEntries(entries) };
}

export default async function handler(_req: any, res: any) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  res.setHeader('Content-Type', 'application/json');
  if (!url || !key) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send(JSON.stringify({ error: 'not configured' }));
  }
  try {
    const body = JSON.stringify(await readSiteData(url, key));
    // Fresh for 30 seconds; for two more minutes the CDN answers at once with its copy while it fetches a new one, and
    // after that it waits for the new one. (It used to serve a copy up to a day old to the first visitor after a quiet
    // spell, so an admin's edit could stay hidden for hours.) An edit therefore reaches visitors within about half a
    // minute, two at most (admins themselves always read live).
    // max-age=15: a browser reuses its copy for 15 seconds instead of asking on every page (each ask was a 304 in the
    // logs); with the CDN's 30 s an edit reaches visitors within about 45 seconds
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=120');
    return res.status(200).send(body);
  } catch (err) {
    console.error('api/site:', err);
    // The site falls back to asking Supabase directly
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).send(JSON.stringify({ error: 'upstream' }));
  }
}
