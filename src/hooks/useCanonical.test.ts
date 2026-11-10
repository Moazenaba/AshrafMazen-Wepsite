import { describe, expect, it } from 'vitest';
import { canonicalFor, SITE_URL } from './useCanonical';

describe('canonicalFor (each page names its own address on the one public domain)', () => {
  it('gives the home page the site root', () => {
    expect(canonicalFor('/')).toBe(`${SITE_URL}/`);
    expect(canonicalFor('')).toBe(`${SITE_URL}/`);
  });
  it('gives a lesson its own address, without a trailing slash', () => {
    expect(canonicalFor('/lesson/abc')).toBe(`${SITE_URL}/lesson/abc`);
    expect(canonicalFor('/lesson/abc/')).toBe(`${SITE_URL}/lesson/abc`);
  });
});
