// Checks the built site in dist/ the way a search engine reads it, after `npm run build`:
//   node scripts/seo-audit.mjs          (exit 1 on any error; warnings are printed only)
//   node scripts/seo-audit.mjs --json   (the same, as JSON)
// Every prerendered page: one canonical on the public domain that names the page itself, a unique title, a real
// description, Arabic RTL, an <h1> with text, valid JSON-LD with the site's one identity, no unexpected noindex,
// internal links that lead to a page. The sitemap: only canonical, indexable pages that exist. robots.txt and llms.txt.
// When the build had no data (CI), only the shell, robots.txt and the sitemap's domain are checked.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { auditPage, auditSite } from './seoAuditRules.mjs';
import { root, siteUrl } from './site-data.mjs';

const dist = resolve(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/ is missing: run `npm run build` first.');
  process.exit(1);
}
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '');
const warnings = JSON.parse(read(join(dist, 'build-warnings.json')) || '{}');
const prerendered = warnings.prerender !== false;

// Every prerendered page: dist/<path>/index.html
const pages = new Map();
function walk(dir, path) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !['assets', 'fonts'].includes(entry.name)) walk(join(dir, entry.name), `${path}/${entry.name}`);
    else if (entry.name === 'index.html') pages.set(decodeURIComponent(path || '/'), read(join(dir, entry.name)));
  }
}
walk(dist, '');

const report = { errors: [], warnings: [], pages: pages.size, prerendered };
const add = (list, path) => (problems) => problems.forEach((p) => list.push(`${path}: ${p}`));

if (prerendered) {
  for (const [path, html] of pages) {
    const { errors, warnings: w } = auditPage(path, html, { siteUrl, exists: (p) => pages.has(p) });
    add(report.errors, path)(errors);
    add(report.warnings, path)(w);
  }
}
// Two pages with the same title compete for the same search; the duplicates are listed (a warning: the titles are the channel's own)
const byTitle = new Map();
for (const [path, html] of pages) {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (title) byTitle.set(title, [...(byTitle.get(title) ?? []), path]);
}
for (const [title, paths] of byTitle) if (paths.length > 1 && prerendered) report.warnings.push(`same title on ${paths.join(', ')}: ${title}`);

const site = auditSite({
  pages,
  siteUrl,
  prerendered,
  sitemap: read(join(dist, 'sitemap.xml')),
  robots: read(join(dist, 'robots.txt')),
  llms: read(join(dist, 'llms.txt')),
  appShell: read(join(dist, 'app.html')),
});
add(report.errors, 'site')(site.errors);
add(report.warnings, 'site')(site.warnings);
report.sitemapUrls = site.sitemapUrls;

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`SEO audit: ${report.pages} pages${prerendered ? '' : ' (build without data: shell checks only)'}, ${site.sitemapUrls} sitemap URLs`);
  for (const w of report.warnings.slice(0, 40)) console.log(`  warn  ${w}`);
  if (report.warnings.length > 40) console.log(`  … ${report.warnings.length - 40} more warnings`);
  for (const e of report.errors) console.log(`  ERROR ${e}`);
  console.log(report.errors.length ? `FAILED: ${report.errors.length} errors` : 'SEO audit passed');
}
process.exit(report.errors.length ? 1 : 0);
