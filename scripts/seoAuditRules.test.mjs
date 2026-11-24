import { describe, expect, it } from 'vitest';
import { auditPage, auditSite } from './seoAuditRules.mjs';

const siteUrl = 'https://site.test';
const graph = (extra = []) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', '@id': `${siteUrl}/#website` }, { '@type': 'Person', '@id': `${siteUrl}/#person` }, ...extra] });
const page = ({ path = '/videos', canonical = `${siteUrl}${path}`, robots = 'index, follow', ld = graph(), body = '<h1>المرئيات</h1><a href="/">الرئيسية</a>', title = 'المرئيات - الشيخ' } = {}) =>
  `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8" /><title>${title}</title>
<meta name="description" content="دروس وخطب ومحاضرات الشيخ المرئية، مرتبة في سلاسل للمشاهدة." />
<meta name="robots" content="${robots}" /><link rel="canonical" href="${canonical}" /><meta property="og:image" content="x" />
<script type="application/ld+json">${ld}</script></head><body><div id="root"><main dir="rtl">${body}</main></div></body></html>`;
const check = (html, path = '/videos', exists = () => true) => auditPage(path, html, { siteUrl, exists }).errors;

describe('auditPage', () => {
  it('passes a correct page', () => {
    expect(check(page())).toEqual([]);
  });
  it('catches a canonical on another domain or another page', () => {
    expect(check(page({ canonical: 'https://ashraf-mazen.vercel.app/videos' }))[0]).toMatch(/is not/);
    expect(check(page({ canonical: `${siteUrl}/` }))[0]).toMatch(/is not/);
  });
  it('catches an accidental noindex, and an indexable search page', () => {
    expect(check(page({ robots: 'noindex, follow' }))).toContain('noindex on a page that should be indexed');
    expect(check(page({ path: '/search' }), '/search')).toContain('search page is indexable');
    expect(check(page({ path: '/search', robots: 'noindex, follow' }), '/search')).toEqual([]);
  });
  it('catches broken or duplicated JSON-LD and a VideoObject without a date', () => {
    expect(check(page({ ld: '{bad' }))).toContain('JSON-LD is not valid JSON');
    expect(check(page({ ld: JSON.stringify({ '@type': 'Person' }) }))).toContain('JSON-LD has no WebSite');
    expect(check(page({ ld: graph([{ '@type': 'VideoObject', name: 'n', description: 'd', thumbnailUrl: ['t'] }]) }))).toContain('VideoObject without uploadDate');
  });
  it('catches a page without prerendered text, and a link to a page that does not exist', () => {
    expect(check(page({ body: '' }))).toContain('no prerendered <h1> text inside #root');
    expect(check(page({ body: '<h1>x</h1><a href="/nowhere">x</a>' }), '/videos', (p) => p !== '/nowhere')).toContain('link to /nowhere, which is not a page');
    expect(check(page({ body: '<h1>x</h1><a href="/lesson/new">x</a>' }), '/videos', () => false)).toEqual([]);
  });
  it('wants the home page to be a ProfilePage about the site Person', () => {
    expect(check(page({ path: '/' }), '/')).toContain('home page is not a ProfilePage about the site Person');
    const profile = graph([{ '@type': 'ProfilePage', '@id': `${siteUrl}/`, mainEntity: { '@id': `${siteUrl}/#person` } }]);
    expect(check(page({ path: '/', ld: profile }), '/')).toEqual([]);
  });
});

describe('auditSite', () => {
  const sitemap = (locs) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="x">${locs.map((l) => `<url><loc>${l}</loc><lastmod>2026-11-01</lastmod></url>`).join('')}</urlset>`;
  const robots = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\nSitemap: ${siteUrl}/sitemap-videos.xml\n`;
  const pages = new Map([['/', ''], ['/videos', '']]);
  it('passes a correct sitemap and robots.txt', () => {
    expect(auditSite({ pages, siteUrl, sitemap: sitemap([`${siteUrl}/`, `${siteUrl}/videos`]), robots, llms: '# x' }).errors).toEqual([]);
  });
  it('catches old domains, noindex pages and duplicates in the sitemap, and a robots.txt that blocks everything', () => {
    const { errors } = auditSite({
      pages,
      siteUrl,
      sitemap: sitemap(['https://ashraf-mazen.vercel.app/', `${siteUrl}/search`, `${siteUrl}/videos`, `${siteUrl}/videos`]),
      robots: 'User-agent: *\nDisallow: /\n',
    });
    expect(errors.join('\n')).toMatch(/not on https:\/\/site.test/);
    expect(errors).toContain('sitemap lists /search, which is noindex');
    expect(errors).toContain('sitemap.xml lists a URL twice');
    expect(errors).toContain('robots.txt blocks the whole site');
  });
  it('catches a robots.txt that blocks the data pages render from', () => {
    const { errors } = auditSite({ pages, siteUrl, sitemap: sitemap([`${siteUrl}/`]), robots: `${robots}Disallow: /api/
`, llms: '# x' });
    expect(errors).toContain('robots.txt blocks /api/, which pages need to render');
  });
});
