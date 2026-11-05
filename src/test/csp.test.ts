import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The site's Content-Security-Policy allows its one inline script (the theme setter in index.html) by its hash.
// If that script is edited, its hash changes and the browser would block it: this test fails first.
const html = readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const csp: string = config.headers
  .flatMap((h: { headers: { key: string; value: string }[] }) => h.headers)
  .find((h: { key: string }) => h.key === 'Content-Security-Policy').value;

describe('Content-Security-Policy (vercel.json)', () => {
  it('allows the inline script of index.html by its hash, and every inline script has a hash', () => {
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(inline.length).toBeGreaterThan(0);
    for (const script of inline) {
      const hash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
      expect(csp).toContain(hash);
    }
  });

  it('does not allow inline or eval scripts in general', () => {
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('forbids plugins, foreign base addresses and framing by other sites', () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  it('lets the site reach what it uses: YouTube, Supabase and Cloudflare R2', () => {
    expect(csp).toContain('https://www.youtube-nocookie.com');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('https://*.r2.cloudflarestorage.com');
  });
});
