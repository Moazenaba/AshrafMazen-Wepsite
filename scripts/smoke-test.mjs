// Opens the running site the way a visitor does and checks that every page and endpoint answers.
//   npm run dev                                         (in one terminal: serves the pages and the /api functions)
//   npm run smoke http://localhost:3000                 (in another)
//   node scripts/smoke-test.mjs https://ashraf-mazen.vercel.app     (against the real, deployed site)
// Note: `vite preview` serves the built pages but not the /api functions, so run the API checks against `npm run dev`
// or against the deployed site.
// Exits with 1 if anything fails.
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

let failures = 0;
const check = (ok, name, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const get = (path, init) => fetch(`${base}${path}`, { redirect: 'manual', ...init });

// Every page of the single-page app must answer with the app shell, not a 404 (this is what vercel.json guarantees)
const pages = ['/', '/videos', '/audio', '/books', '/search', '/bookmarks', '/contribute', '/playlist/PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', '/book/none', '/lesson/none', '/video/none', '/admin'];
for (const path of pages) {
  const response = await get(path);
  const html = response.ok ? await response.text() : '';
  check(response.status === 200 && html.includes('id="root"'), `page ${path}`, `HTTP ${response.status}`);
}

const sitemap = await get('/sitemap.xml');
const sitemapText = sitemap.ok ? await sitemap.text() : '';
check(sitemap.ok && sitemapText.includes('<urlset'), 'sitemap.xml', sitemap.ok ? `${(sitemapText.match(/<loc>/g) || []).length} URLs` : `HTTP ${sitemap.status}`);
const robots = await get('/robots.txt');
check(robots.ok && (await robots.text()).includes('Sitemap:'), 'robots.txt');

// Endpoints
const library = await get('/api/youtube-library');
const libraryJson = library.ok ? await library.json().catch(() => null) : null;
check(!!libraryJson?.playlists?.length, 'API /api/youtube-library', library.ok ? `${libraryJson?.playlists?.length ?? 0} playlists` : `HTTP ${library.status}`);

const upload = await get('/api/r2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sign', kind: 'pdf', filename: 'a.pdf', size: 5 }) });
check([403, 501].includes(upload.status), 'API /api/r2 refuses visitors', `HTTP ${upload.status} (403 = guarded, 501 = storage not configured here)`);

const outside = await get(`/api/r2?file=${encodeURIComponent('secret/x.txt')}`);
check([400, 501].includes(outside.status), 'API /api/r2 serves only the site\'s own folders', `HTTP ${outside.status}`);

const badSubmit = await get('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'nonsense', title: 'x' }) });
check(badSubmit.status === 400, 'API /api/submit rejects a bad request', `HTTP ${badSubmit.status}`);

const bot = await get('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'book', title: 'bot', url: 'https://x.test/a.pdf', website: 'spam' }) });
check(bot.status === 200, 'API /api/submit quietly drops bots (honeypot)', `HTTP ${bot.status}`);

const wrongMethod = await get('/api/submit');
check(wrongMethod.status === 405, 'API /api/submit accepts POST only', `HTTP ${wrongMethod.status}`);

console.log(`\n${failures === 0 ? 'ALL PASSED' : `${failures} FAILED`} against ${base}`);
process.exit(failures === 0 ? 0 : 1);
