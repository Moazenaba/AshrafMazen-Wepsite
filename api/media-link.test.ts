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

  describe('success path', () => {
    const channelOembed = JSON.stringify({ author_url: 'https://www.youtube.com/@Ashrafmazen', author_name: 'x' });
    const happyFetch = () =>
      vi.fn(async (url: string) => {
        const u = String(url);
        if (u.includes('oembed')) return new Response(channelOembed);
        if (u.includes('cdn.example.com')) return new Response(new Uint8Array(64), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
        return new Response(JSON.stringify({ status: 'tunnel', url: 'https://cdn.example.com/a.mp3', filename: 'a.mp3' }));
      });
    const call = async (ip: string, id = 'abcdefghijk') => {
      const res = fakeRes();
      await handler(fakeReq({ query: { id }, headers: { 'x-forwarded-for': ip } }), res);
      return res;
    };

    it('answers a second ask for the same video within 2 minutes without calling fetch', async () => {
      const f = happyFetch();
      vi.stubGlobal('fetch', f);
      vi.spyOn(console, 'log').mockImplementation(() => {});
      expect((await call('7.7.7.1', 'memoVideo01')).statusCode).toBe(200);
      const before = f.mock.calls.length;
      expect((await call('7.7.7.1', 'memoVideo01')).statusCode).toBe(200);
      expect(f.mock.calls.length).toBe(before);
    });

    it('answers 429 on the 7th call from one address', async () => {
      vi.stubGlobal('fetch', happyFetch());
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const codes: number[] = [];
      for (let i = 0; i < 7; i++) codes.push((await call('7.7.7.2', `limitVid${String(i).padStart(3, '0')}`)).statusCode);
      expect(codes.slice(0, 6).every((c) => c === 200)).toBe(true);
      expect(codes[6]).toBe(429);
    });
  });
});
