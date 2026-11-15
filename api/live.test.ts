import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './live';
import { fakeReq, fakeRes, json } from './_testing';

const CHANNEL = 'UCisGvsFtKyDU6NTFywaITzQ';
const livePage = (channelId: string) =>
  `<script>var ytInitialPlayerResponse = ${JSON.stringify({
    videoDetails: { videoId: 'loVFoAlqeCc', channelId, title: 'بث', isLive: true },
    microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: true } } },
  })};</script>`;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/live', () => {
  it('answers live:false for a channel page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>channel</html>')));
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(json(res)).toEqual({ live: false });
  });

  it('answers live:true with the video of the right channel', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(livePage(CHANNEL))));
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(json(res)).toEqual({ live: true, videoId: 'loVFoAlqeCc', title: 'بث' });
  });

  it('answers live:false with the short cache when fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(json(res)).toEqual({ live: false });
    expect(res.headers['cache-control']).toBe('public, max-age=0, s-maxage=30');
  });

  it('asks YouTube in Arabic', async () => {
    const f = vi.fn(async (..._args: unknown[]) => new Response(''));
    vi.stubGlobal('fetch', f);
    await handler(fakeReq(), fakeRes());
    expect(String(f.mock.calls[0][0])).toContain('hl=ar');
  });

  it('answers live:false when YouTube does not answer in time', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => new Promise((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('x', 'AbortError')))));
    const res = fakeRes();
    const done = handler(fakeReq(), res);
    await vi.advanceTimersByTimeAsync(8001);
    await done;
    expect(json(res)).toEqual({ live: false });
  });
});
