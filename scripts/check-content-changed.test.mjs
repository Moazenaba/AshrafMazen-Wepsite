import { describe, expect, it } from 'vitest';
import { compare } from './check-content-changed.mjs';
import { contentHash } from './contentHash.mjs';

const lessons = [
  { id: 'a', published_at: '2026-01-02' },
  { id: 'b', published_at: '2026-01-01' },
];

const site = (apiBody, hash, over = {}) => async (url) => {
  if (over.throws) throw new Error('offline');
  if (url.endsWith('/api/site')) return new Response(JSON.stringify(apiBody), { status: over.apiStatus ?? 200 });
  return new Response(hash, { status: 200 });
};

describe('compare', () => {
  it('is same when the hash matches, whatever the order of the lessons', async () => {
    expect(await compare(site({ lessons: [...lessons].reverse() }, contentHash(lessons)), 'https://s.test')).toBe('same');
  });

  it('is changed when a lesson was added', async () => {
    const hash = contentHash(lessons);
    expect(await compare(site({ lessons: [...lessons, { id: 'c', published_at: '2026-02-01' }] }, hash), 'https://s.test')).toBe('changed');
  });

  it('is unknown (so no commit) when a fetch fails', async () => {
    expect(await compare(site({ lessons }, 'x', { throws: true }), 'https://s.test')).toBe('unknown');
    expect(await compare(site({ lessons }, 'x', { apiStatus: 500 }), 'https://s.test')).toBe('unknown');
  });
});
