// Run daily by .github/workflows/sync-youtube.yml. If the lessons published on the live site differ from the lessons the
// deployed pages were built from, it asks for a rebuild (an empty commit that Vercel deploys), so a lesson added in the
// admin reaches the sitemap and the prerendered pages without anyone touching the code.
//   node scripts/check-content-changed.mjs            prints "changed" or "same" and exits 0 (also when it cannot tell)
import { contentHash } from './contentHash.mjs';

const SITE = (process.env.SITE_URL || 'https://ashraf-mazen.vercel.app').replace(/\/+$/, '');

// 'changed' | 'same' | 'unknown'
export async function compare(fetcher = fetch, site = SITE) {
  try {
    const [api, built] = await Promise.all([fetcher(`${site}/api/site`), fetcher(`${site}/content-hash.txt`)]);
    if (!api.ok || !built.ok) return 'unknown';
    const data = await api.json();
    if (!Array.isArray(data?.lessons)) return 'unknown';
    return contentHash(data.lessons) === (await built.text()).trim() ? 'same' : 'changed';
  } catch {
    return 'unknown';
  }
}

if (process.argv[1] && process.argv[1].endsWith('check-content-changed.mjs')) {
  console.log(await compare());
}
