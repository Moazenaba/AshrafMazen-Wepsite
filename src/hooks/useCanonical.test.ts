import { describe, expect, it } from 'vitest';
import { canonicalFor, INDEX, robotsFor, SITE_URL } from './useCanonical';

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

describe('robotsFor (which pages stay out of search results)', () => {
  it('keeps content pages indexable', () => {
    for (const path of ['/', '/videos', '/lesson/abc', '/video/97IefgSKav4', '/searching-for-truth']) expect(robotsFor(path)).toBe(INDEX);
  });
  it('keeps search results, bookmarks and the request form out, but lets their links be followed', () => {
    for (const path of ['/search', '/search/', '/bookmarks', '/contribute', '/admin/lessons', '/dev/admin']) expect(robotsFor(path)).toBe('noindex, follow');
  });
});

it('the one public domain is ashrafmazen.com', () => {
  expect(SITE_URL).toBe('https://ashrafmazen.com');
});
