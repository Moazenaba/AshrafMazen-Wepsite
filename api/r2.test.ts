import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Pretend R2 settings (no request leaves the test: a GET only answers with a redirect)
const SETTINGS = { R2_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET: 'site-bucket', R2_ACCESS_KEY_ID: 'k'.repeat(32), R2_SECRET_ACCESS_KEY: 's'.repeat(64) };

async function get(query: Record<string, string>) {
  vi.resetModules();
  const handler = (await import('./r2')).default;
  const headers: Record<string, string> = {};
  const res: any = {
    statusCode: 200,
    setHeader: (k: string, v: string) => (headers[k.toLowerCase()] = v),
    status(code: number) { this.statusCode = code; return this; },
    send() { return this; },
    end() { return this; },
  };
  await handler({ method: 'GET', query, headers: {} }, res);
  return { status: res.statusCode, location: headers.location ?? '', cache: headers['cache-control'] ?? '' };
}

beforeEach(() => {
  for (const [k, v] of Object.entries(SETTINGS)) vi.stubEnv(k, v);
});
afterEach(() => vi.unstubAllEnvs());

describe('r2 file links', () => {
  it('without a public address: a short redirect to a signed link on the private bucket', async () => {
    vi.stubEnv('R2_PUBLIC_URL', '');
    vi.stubEnv('VITE_R2_PUBLIC_URL', '');
    const r = await get({ file: 'audio/x.ogg' });
    expect(r.status).toBe(302);
    expect(r.location).toContain('.r2.cloudflarestorage.com/site-bucket/audio/x.ogg?');
  });

  it('with a public address: a permanent redirect there, remembered by the browser for a year', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-123.r2.dev/');
    const r = await get({ file: 'branding/hero/a.jpeg' });
    expect(r.status).toBe(308);
    expect(r.location).toBe('https://pub-123.r2.dev/branding/hero/a.jpeg');
    expect(r.cache).toContain('max-age=31536000');
  });

  it('keeps library PDFs and named downloads on the signed link', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-123.r2.dev');
    expect((await get({ file: 'library/files/book.pdf' })).status).toBe(302);
    expect((await get({ file: 'audio/x.ogg', download: '1', name: 'درس' })).status).toBe(302);
  });

  it('refuses anything outside the site folders', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-123.r2.dev');
    expect((await get({ file: 'private/x.txt' })).status).toBe(400);
    expect((await get({ file: 'audio/../x' })).status).toBe(400);
  });
});
