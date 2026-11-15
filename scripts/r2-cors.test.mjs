import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Uploads fail with a browser CORS error when the bucket's rule does not list the live domain (it happened on 2026-11-15).
const rule = JSON.parse(readFileSync('docs/r2-cors.json', 'utf8'))[0];

describe('docs/r2-cors.json', () => {
  it('allows the live domain', () => {
    expect(rule.AllowedOrigins).toContain('https://ashraf-mazen.vercel.app');
  });

  it('allows PUT for uploads', () => {
    expect(rule.AllowedMethods).toContain('PUT');
  });

  it('is the same list scripts/r2-setup.ts applies', () => {
    const setup = readFileSync('scripts/r2-setup.ts', 'utf8');
    for (const origin of rule.AllowedOrigins) expect(setup).toContain(origin);
  });
});
