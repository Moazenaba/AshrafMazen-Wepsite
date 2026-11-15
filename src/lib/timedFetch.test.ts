import { afterEach, describe, expect, it, vi } from 'vitest';
import { timedFetch } from './timedFetch';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('timedFetch', () => {
  it('resolves when the answer comes first', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')));
    expect(await (await timedFetch('https://x.test')).text()).toBe('ok');
  });

  it('rejects with timeout when no answer comes', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => new Promise((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
    const result = timedFetch('https://x.test', {}, 100);
    const assertion = expect(result).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(101);
    await assertion;
  });

  it('clears its timer after an answer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')));
    await timedFetch('https://x.test');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('passes other errors through unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    await expect(timedFetch('https://x.test')).rejects.toThrow('offline');
  });
});
