import { describe, expect, it } from 'vitest';
import { runChecks } from './smoke-test.mjs';

const HOME = '<html><head><title>الموقع</title></head><body><div id="root"></div></body></html>';
const SITEMAP = `<urlset>${'<loc>x</loc>'.repeat(120)}</urlset>`;

// A fake site: every path answers well unless `over` replaces it
function site(over = {}) {
  return async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (over[path]) return over[path](init);
    const ok = (body, headers = {}, status = 200) => new Response(body, { status, headers });
    if (path === '/') return ok(HOME, { 'content-security-policy': "default-src 'self'", 'strict-transport-security': 'max-age=1' });
    if (path === '/sitemap.xml') return ok(SITEMAP);
    if (path === '/robots.txt') return ok('Sitemap: x');
    if (path === '/api/site') return ok(JSON.stringify({ categories: [{ id: 1 }], lessons: [{ id: 1 }] }));
    if (path === '/api/live') return ok(JSON.stringify({ live: false }));
    if (path === '/api/youtube-library') return ok(JSON.stringify({ playlists: [{ id: 1 }] }));
    if (path === '/api/r2') return init.method === 'POST' ? ok('', {}, 403) : ok('', {}, 400);
    if (path === '/api/submit') {
      if (init.method !== 'POST') return ok('', {}, 405);
      return JSON.parse(init.body).website ? ok('{}') : ok('{}', {}, 400);
    }
    return ok(HOME);
  };
}

describe('runChecks', () => {
  it('passes everything on good answers', async () => {
    const results = await runChecks('https://s.test', site());
    expect(results.filter((r) => !r.ok).map((r) => r.name)).toEqual([]);
  });

  it('fails and names /api/site on a 500', async () => {
    const results = await runChecks('https://s.test', site({ '/api/site': () => new Response('x', { status: 500 }) }));
    expect(results.filter((r) => !r.ok).map((r) => r.name)).toEqual(['API /api/site has categories and lessons']);
  });

  it('fails when the lessons list is empty', async () => {
    const results = await runChecks('https://s.test', site({ '/api/site': () => new Response(JSON.stringify({ categories: [{ id: 1 }], lessons: [] })) }));
    expect(results.some((r) => !r.ok && r.name.includes('/api/site'))).toBe(true);
  });

  it('fails when the security headers are missing', async () => {
    const results = await runChecks('https://s.test', site({ '/': () => new Response(HOME) }));
    expect(results.some((r) => !r.ok && r.name === 'security headers on /')).toBe(true);
  });

  it('fails a sitemap with fewer than 100 addresses', async () => {
    const results = await runChecks('https://s.test', site({ '/sitemap.xml': () => new Response('<urlset><loc>x</loc></urlset>') }));
    expect(results.some((r) => !r.ok && r.name === 'sitemap.xml')).toBe(true);
  });
});
