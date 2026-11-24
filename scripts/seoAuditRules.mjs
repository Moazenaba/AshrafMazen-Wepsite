// The rules of scripts/seo-audit.mjs as pure functions over HTML text, so they are tested without a build.

// Pages that are meant to stay out of search results (same list as src/hooks/useCanonical.ts)
export const NOINDEX_PATHS = ['/search', '/bookmarks', '/contribute'];
// Routes the app renders for any id, so a link to one is fine even when that page was not prerendered
const DYNAMIC = /^\/(lesson|video|playlist|series|category|book|quran\/reciter|quran\/read)\//;

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const all = (html, re) => [...html.matchAll(re)].map((m) => m[0]);
const meta = (html, key, value) => all(html, new RegExp(`<meta ${key}="${value}"[^>]*>`, 'g')).map((t) => attr(t, 'content'));
const unescape = (s = '') => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

// One page. `exists(path)` says whether a prerendered page is at that path.
export function auditPage(path, html, { siteUrl, exists = () => true }) {
  const errors = [];
  const warnings = [];
  const expected = `${siteUrl}${path === '/' ? '/' : encodeURI(path)}`;

  const canonicals = all(html, /<link rel="canonical"[^>]*>/g).map((t) => attr(t, 'href'));
  if (canonicals.length !== 1) errors.push(`${canonicals.length} canonical links (want 1)`);
  else if (canonicals[0] !== expected) errors.push(`canonical ${canonicals[0]} is not ${expected}`);
  const ogUrl = meta(html, 'property', 'og:url')[0];
  if (ogUrl && ogUrl !== expected) errors.push(`og:url ${ogUrl} is not ${expected}`);

  const title = unescape(html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim());
  if (!title) errors.push('no <title>');
  else if (title.length > 70) warnings.push(`title is ${title.length} characters (search shows about 60)`);
  const description = unescape(meta(html, 'name', 'description')[0]);
  if (!description) errors.push('no meta description');
  else if (description.length < 40) warnings.push(`description is short (${description.length} characters)`);

  if (!/<html[^>]*lang="ar"[^>]*dir="rtl"/.test(html)) errors.push('<html> is not lang="ar" dir="rtl"');
  if (!/<meta charset="UTF-8"/i.test(html)) errors.push('no UTF-8 charset');
  const robots = meta(html, 'name', 'robots');
  if (robots.length > 1) errors.push('more than one robots meta');
  const noindex = robots.some((r) => /noindex/.test(r));
  if (noindex !== NOINDEX_PATHS.includes(path)) errors.push(noindex ? 'noindex on a page that should be indexed' : 'search page is indexable');
  if (!/<meta property="og:image"/.test(html)) warnings.push('no og:image');

  const h1 = html.match(/<div id="root"><main[^>]*>[\s\S]*?<h1>([^<]*)<\/h1>/)?.[1]?.trim();
  if (!h1) errors.push('no prerendered <h1> text inside #root');

  const blocks = jsonLdBlocks(html);
  if (blocks.length !== 1) errors.push(`${blocks.length} JSON-LD blocks (want one @graph)`);
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block);
    } catch {
      errors.push('JSON-LD is not valid JSON');
      continue;
    }
    const nodes = data['@graph'] ?? [data];
    const ids = nodes.map((n) => n['@id']).filter(Boolean);
    if (new Set(ids).size !== ids.length) errors.push('JSON-LD repeats an @id');
    if (!nodes.some((n) => n['@type'] === 'Person' && n['@id'] === `${siteUrl}/#person`)) errors.push('JSON-LD has no site Person');
    if (!nodes.some((n) => n['@type'] === 'WebSite' && n['@id'] === `${siteUrl}/#website`)) errors.push('JSON-LD has no WebSite');
    const text = JSON.stringify(data);
    for (const u of text.match(/https?:\/\/[^"\s]+/g) ?? []) {
      if (/\.vercel\.app/.test(u)) errors.push(`JSON-LD names an old address ${u}`);
    }
    for (const n of nodes) {
      if (n['@type'] === 'VideoObject') {
        for (const key of ['name', 'description', 'thumbnailUrl', 'uploadDate']) if (!n[key]) errors.push(`VideoObject without ${key}`);
        if (n.uploadDate && Number.isNaN(Date.parse(n.uploadDate))) errors.push(`VideoObject uploadDate "${n.uploadDate}" is not a date`);
      }
      if (n['@type'] === 'BreadcrumbList' && !n.itemListElement?.every((i, k) => i.position === k + 1 && i.item?.startsWith(siteUrl))) {
        errors.push('BreadcrumbList items are not numbered links on the site');
      }
      if (n['@type'] === 'Article' && (!n.headline || n.headline.length > 110)) errors.push('Article headline missing or over 110 characters');
    }
  }

  const root = html.match(/<div id="root">([\s\S]*?)<\/div>\s*(<script|<\/body>)/)?.[1] ?? '';
  for (const href of new Set([...root.matchAll(/<a href="([^"]*)"/g)].map((m) => unescape(m[1])))) {
    if (!href.startsWith('/')) continue;
    const target = decodeURI(href.split(/[?#]/)[0]).replace(/\/+$/, '') || '/';
    if (!exists(target) && !DYNAMIC.test(target)) errors.push(`link to ${href}, which is not a page`);
  }
  return { errors, warnings };
}

// The files every page relies on: sitemap.xml, robots.txt, llms.txt and the fallback shell app.html
export function auditSite({ pages, siteUrl, prerendered = true, sitemap = '', robots = '', llms = '', appShell = '' }) {
  const errors = [];
  const warnings = [];
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => unescape(m[1]));
  if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset /.test(sitemap) || !sitemap.trim().endsWith('</urlset>')) errors.push('sitemap.xml is not a urlset');
  if (new Set(locs).size !== locs.length) errors.push('sitemap.xml lists a URL twice');
  for (const loc of locs) {
    if (!loc.startsWith(`${siteUrl}/`)) {
      errors.push(`sitemap URL ${loc} is not on ${siteUrl}`);
      continue;
    }
    if (/\/$/.test(loc) && loc !== `${siteUrl}/`) errors.push(`sitemap URL ${loc} ends with a slash`);
    const path = decodeURIComponent(loc.slice(siteUrl.length)) || '/';
    if (NOINDEX_PATHS.includes(path)) errors.push(`sitemap lists ${path}, which is noindex`);
    if (prerendered && !pages.has(path)) warnings.push(`sitemap lists ${path}, which was not prerendered`);
  }
  for (const d of sitemap.match(/<lastmod>([^<]*)<\/lastmod>/g) ?? []) {
    if (!/^<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>$/.test(d)) errors.push(`bad ${d}`);
  }
  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) errors.push('robots.txt does not name the sitemap');
  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap-videos.xml`)) warnings.push('robots.txt does not name the videos sitemap');
  if (/^Disallow:\s*\/\s*$/m.test(robots)) errors.push('robots.txt blocks the whole site');
  // Google renders pages with their data; blocking /api/, /assets/ or /fonts/ leaves the rendered page empty
  const disallowed = robots
    .split(/\r?\n/)
    .filter((line) => /^disallow:/i.test(line.trim()))
    .map((line) => line.slice(line.indexOf(':') + 1).trim())
    .filter(Boolean);
  for (const path of ['/api/', '/assets/', '/fonts/']) {
    if (disallowed.some((d) => path.startsWith(d) || d.startsWith(path))) errors.push(`robots.txt blocks ${path}, which pages need to render`);
  }
  if (!llms.startsWith('# ')) warnings.push('llms.txt is missing');
  if (/vercel\.app/.test(robots + llms + sitemap)) errors.push('robots, llms or sitemap names a vercel.app address');
  if (appShell && /<link rel="canonical"/.test(appShell)) errors.push('app.html has a canonical (it serves pages added after the build)');
  return { errors, warnings, sitemapUrls: locs.length };
}
