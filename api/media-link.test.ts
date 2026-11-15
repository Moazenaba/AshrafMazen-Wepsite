import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './media-link';
import { fakeReq, fakeRes, json } from './_testing';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/media-link', () => {
  it('400 for a malformed id', async () => {
    const res = fakeRes();
    await handler(fakeReq({ query: { id: 'bad id' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('403 for a video that is not from the channel', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ author_url: 'https://www.youtube.com/@other', author_name: 'x' }))));
    const res = fakeRes();
    await handler(fakeReq({ query: { id: 'zzzzzzzzzzz' } }), res);
    expect(res.statusCode).toBe(403);
  });

  it('502 with the tried services when every service fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('oembed')) return new Response(JSON.stringify({ author_url: 'https://www.youtube.com/@Ashrafmazen', author_name: 'x' }));
      return new Response('{"error":"down"}', { status: 500 });
    }));
    const res = fakeRes();
    await handler(fakeReq({ query: { id: 'zzzzzzzzzzz' } }), res);
    expect(res.statusCode).toBe(502);
    expect(Array.isArray(json(res).tried)).toBe(true);
  });
});
