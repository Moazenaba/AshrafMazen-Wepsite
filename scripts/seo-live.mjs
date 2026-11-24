// Read-only SEO check of the deployed site (GET and HEAD only, never signs in or submits):
//   node scripts/seo-live.mjs                       (https://ashrafmazen.com)
//   node scripts/seo-live.mjs https://ashrafmazen.com --sample 40
// Old addresses and www answer with one permanent redirect to the same path on the domain; a trailing slash is
// redirected; robots.txt and both sitemaps answer as text/XML; a sample of sitemap pages answers 200 with a
// canonical that names the page itself and no noindex; an unknown page is not left indexable on its own address.
const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) || 'https://ashrafmazen.com').replace(/\/+$/, '');
const sample = Number(args[args.indexOf('--sample') + 1]) || 25;
const host = new URL(base).host;
const legacy = ['https://ashraf-mazen.vercel.app', 'https://ashraf-mazen-wepsite.vercel.app', `https://www.${host}`];

const failures = [];
const ok = (cond, message) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${message}`);
  if (!cond) failures.push(message);
};
const get = (url, opts = {}) => fetch(url, { redirect: 'manual', headers: { 'user-agent': 'seo-live-check' }, ...opts });

for (const origin of legacy) {
  const res = await get(`${origin}/videos?x=1`).catch((e) => ({ status: 0, headers: new Headers(), e }));
  const to = res.headers.get('location');
  ok([301, 308].includes(res.status) && to === `${base}/videos?x=1`, `${origin}/videos → ${res.status} ${to ?? ''}`);
}
const slash = await get(`${base}/videos/`);
ok([301, 308].includes(slash.status) && slash.headers.get('location')?.replace(base, '') === '/videos', `/videos/ → ${slash.status} ${slash.headers.get('location') ?? ''}`);

const robots = await get(`${base}/robots.txt`);
const robotsText = await robots.text();
ok(robots.status === 200 && robotsText.includes(`Sitemap: ${base}/sitemap.xml`), `robots.txt ${robots.status}, names the sitemap`);
for (const path of ['/sitemap.xml', '/sitemap-videos.xml']) {
  const res = await get(`${base}${path}`);
  ok(res.status === 200 && /xml/.test(res.headers.get('content-type') || ''), `${path} ${res.status} ${res.headers.get('content-type')}`);
}

const sitemap = await (await get(`${base}/sitemap.xml`)).text();
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
const pick = [...locs.filter((u) => !/\/video\//.test(u)), ...locs.filter((u) => /\/video\//.test(u)).sort(() => Math.random() - 0.5)].slice(0, sample);
for (const loc of pick) {
  const res = await get(loc);
  const html = res.status === 200 ? await res.text() : '';
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  ok(res.status === 200 && canonical === loc && !noindex, `${loc.replace(base, '') || '/'} ${res.status}${canonical === loc ? '' : ` canonical=${canonical}`}${noindex ? ' NOINDEX' : ''}`);
}

const unknown = await get(`${base}/no-such-page-${Date.now()}`);
const unknownHtml = await unknown.text();
ok(!/<link rel="canonical"/.test(unknownHtml), `unknown page ${unknown.status} has no canonical of its own (the app sends it home)`);

console.log(failures.length ? `\nFAILED: ${failures.length}` : `\nALL PASSED (${pick.length} sitemap pages checked)`);
process.exit(failures.length ? 1 : 0);
