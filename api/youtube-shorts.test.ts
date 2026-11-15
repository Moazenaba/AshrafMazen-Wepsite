import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeReq, fakeRes, json } from './_testing';

const shortsPage = (ids: string[]) =>
  ids.map((id) => `{"shortsLockupViewModel":{"onTap":{"innertubeCommand":{"reelWatchEndpoint":{"videoId":"${id}"}}},"overlayMetadata":{"primaryText":{"content":"عنوان ${id}"}}}}`).join(',');

async function call() {
  vi.resetModules();
  const handler = (await import('./youtube-shorts')).default;
  const res = fakeRes();
  await handler(fakeReq(), res);
  return res;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/youtube-shorts', () => {
  it('never asks for an RSS feed, and asks in Arabic', async () => {
    const f = vi.fn(async (..._a: unknown[]) => new Response('<html></html>'));
    vi.stubGlobal('fetch', f);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await call();
    const urls = f.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('/feeds/'))).toBe(false);
    expect(urls.find((u) => u.includes('/shorts'))).toContain('hl=ar');
  });

  it('answers an empty list and logs once when nothing is read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html></html>')));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await call();
    expect(json(res).shorts).toEqual([]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('no shorts read');
  });

  it('keeps the last good list when a later read is empty', async () => {
    vi.resetModules();
    const handler = (await import('./youtube-shorts')).default;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response(`<script>var x = [${shortsPage(['aaaaaaaaaaa'])}]</script>`)));
    const first = fakeRes();
    await handler(fakeReq(), first);
    expect(json(first).shorts.map((s: { id: string }) => s.id)).toEqual(['aaaaaaaaaaa']);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 7 * 3600_000);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html></html>')));
    const second = fakeRes();
    await handler(fakeReq(), second);
    vi.useRealTimers();
    expect(json(second).shorts.map((s: { id: string }) => s.id)).toEqual(['aaaaaaaaaaa']);
  });
});
