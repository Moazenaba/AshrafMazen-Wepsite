// Opens the running site the way a visitor does and checks that every page and endpoint answers.
//   npm run dev                                         (in one terminal: serves the pages and the /api functions)
//   npm run smoke http://localhost:3000                 (in another)
//   node scripts/smoke-test.mjs https://ashraf-mazen.vercel.app     (against the real, deployed site)
//   add --json to print { ok, failed: [...] } instead of the list (used by the monitor in .github/workflows/sync-youtube.yml)
// Note: `vite preview` serves the built pages but not the /api functions, so run the API checks against `npm run dev`
// or against the deployed site.
// Exits with 1 if anything fails; every failed check prints a line starting with FAIL.
import { pathToFileURL } from 'node:url';

// Every page of the single-page app must answer with the app shell, not a 404 (this is what vercel.json guarantees)
const pages = ['/', '/videos', '/audio', '/books', '/search', '/bookmarks', '/contribute', '/playlist/PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', '/book/none', '/lesson/none', '/video/none', '/admin'];

// Runs every check against `base` and returns [{ ok, name, detail }]. `fetcher` is injectable for tests.
export async function runChecks(base, fetcher = fetch) {
  const root = base.replace(/\/+$/, '');
  const results = [];
  const check = (ok, name, detail = '') => results.push({ ok: !!ok, name, detail });
  const get = (path, init) => fetcher(`${root}${path}`, { redirect: 'manual', ...init });
  const json = async (response) => (response.ok ? response.json().catch(() => null) : null);

  for (const path of pages) {
    const response = await get(path);
    const html = response.ok ? await response.text() : '';
    check(response.status === 200 && html.includes('id="root"'), `page ${path}`, `HTTP ${response.status}`);
    if (path === '/') {
      check(/<title>[^<]+<\/title>/.test(html), 'home page has a title');
      const csp = response.headers.get('content-security-policy');
      const hsts = response.headers.get('strict-transport-security');
      check(!!csp && !!hsts, 'security headers on /', `${csp ? 'csp' : 'no csp'}, ${hsts ? 'hsts' : 'no hsts'}`);
    }
  }

  const sitemap = await get('/sitemap.xml');
  const sitemapText = sitemap.ok ? await sitemap.text() : '';
  const urls = (sitemapText.match(/<loc>/g) || []).length;
  check(sitemap.ok && sitemapText.includes('<urlset') && urls >= 100, 'sitemap.xml', sitemap.ok ? `${urls} URLs` : `HTTP ${sitemap.status}`);
  // A build that could not read the database writes this file (scripts/prerender.mjs --soft)
  const warnings = await get('/build-warnings.json');
  const warned = warnings.ok ? await warnings.json().catch(() => null) : null;
  check(!(warned && warned.prerender === false), 'prerendered pages', warned?.reason ? String(warned.reason) : '');

  const robots = await get('/robots.txt');
  check(robots.ok && (await robots.text()).includes('Sitemap:'), 'robots.txt');

  // Endpoints
  const site = await get('/api/site');
  const siteJson = await json(site);
  check(site.ok && siteJson?.categories?.length > 0 && siteJson?.lessons?.length > 0, 'API /api/site has categories and lessons', `HTTP ${site.status}`);

  const live = await get('/api/live');
  const liveJson = await json(live);
  check(live.ok && typeof liveJson?.live === 'boolean', 'API /api/live answers a yes or no', `HTTP ${live.status}`);

  const library = await get('/api/youtube-library');
  const libraryJson = await json(library);
  check(!!libraryJson?.playlists?.length, 'API /api/youtube-library', library.ok ? `${libraryJson?.playlists?.length ?? 0} playlists` : `HTTP ${library.status}`);

  const upload = await get('/api/r2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sign', kind: 'pdf', filename: 'a.pdf', size: 5 }) });
  check([403, 501].includes(upload.status), 'API /api/r2 refuses visitors', `HTTP ${upload.status} (403 = guarded, 501 = storage not configured here)`);

  const outside = await get(`/api/r2?file=${encodeURIComponent('secret/x.txt')}`);
  check([400, 501].includes(outside.status), "API /api/r2 serves only the site's own folders", `HTTP ${outside.status}`);

  const badSubmit = await get('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'nonsense', title: 'x' }) });
  check(badSubmit.status === 400, 'API /api/submit rejects a bad request', `HTTP ${badSubmit.status}`);

  const bot = await get('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'book', title: 'bot', url: 'https://x.test/a.pdf', website: 'spam' }) });
  check(bot.status === 200, 'API /api/submit quietly drops bots (honeypot)', `HTTP ${bot.status}`);

  const wrongMethod = await get('/api/submit');
  check(wrongMethod.status === 405, 'API /api/submit accepts POST only', `HTTP ${wrongMethod.status}`);

  return results;
}

async function main() {
  const base = (process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3000').replace(/\/+$/, '');
  const asJson = process.argv.includes('--json');
  const results = await runChecks(base);
  const failed = results.filter((r) => !r.ok);
  if (asJson) {
    console.log(JSON.stringify({ ok: failed.length === 0, failed: failed.map((r) => r.name) }));
    for (const r of failed) console.error(`FAIL  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
  } else {
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
    console.log(`\n${failed.length === 0 ? 'ALL PASSED' : `${failed.length} FAILED`} against ${base}`);
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
