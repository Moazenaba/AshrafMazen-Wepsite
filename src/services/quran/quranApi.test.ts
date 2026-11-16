// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const wordsAnswer = { data: { words: [[1, 1, 0, 500, 1], [1, 2, 500, 900, 1]], text: { ayahs: [[1, [[1, 'بِسْمِ', 'x', 1], [2, 'ٱللَّهِ', 'x', 2]]]] } } };
const ayahsAnswer = { data: { ayahs: [[1, 0, 900]] } };
const plain = { data: { ayahs: [[1, [[1, 'الحمد', 'x', 1]]]] } };

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

// A fake MP3Quran v4: every address answered by `routes`
function stub(routes: { words?: unknown; ayahs?: unknown; plain?: unknown; status?: number }) {
  const f = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (routes.status) return reply({}, routes.status);
    if (url.includes('word-timings')) return reply(routes.words ?? {});
    if (url.includes('ayah-timings')) return reply(routes.ayahs ?? {});
    return reply(routes.plain ?? {});
  });
  vi.stubGlobal('fetch', f);
  return f;
}

async function api() {
  vi.resetModules();
  return import('./quranApi');
}

beforeEach(() => {
  sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getSurahSync', () => {
  it('gives word level when words and text are there', async () => {
    stub({ words: wordsAnswer, ayahs: ayahsAnswer });
    const { getSurahSync } = await api();
    const sync = await getSurahSync('mahmoud-husary/r1', 1);
    expect(sync.level).toBe('word');
    expect(sync.words).toHaveLength(2);
  });

  it('gives ayah level when words are missing', async () => {
    stub({ ayahs: ayahsAnswer, plain });
    const { getSurahSync } = await api();
    const sync = await getSurahSync('mahmoud-husary/r1', 1);
    expect(sync.level).toBe('ayah');
    expect(sync.text[0].words[0].text).toBe('الحمد');
  });

  it('gives none on a 500', async () => {
    stub({ status: 500 });
    const { getSurahSync } = await api();
    expect((await getSurahSync('mahmoud-husary/r1', 1)).level).toBe('none');
  });

  it('gives none on broken JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>not json', { status: 200 })));
    const { getSurahSync } = await api();
    expect((await getSurahSync('mahmoud-husary/r1', 1)).level).toBe('none');
  });

  it('gives none (and never throws) when the service does not answer in time', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_u: unknown, init: RequestInit) => new Promise((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('x', 'AbortError')))));
    const { getSurahSync } = await api();
    const result = getSurahSync('mahmoud-husary/r1', 1);
    await vi.advanceTimersByTimeAsync(20000);
    expect((await result).level).toBe('none');
  });

  it('reads sessionStorage the second time and does not fetch', async () => {
    const f = stub({ words: wordsAnswer, ayahs: ayahsAnswer });
    const { getSurahSync } = await api();
    await getSurahSync('mahmoud-husary/r1', 1);
    const calls = f.mock.calls.length;
    const again = await (await api()).getSurahSync('mahmoud-husary/r1', 1);
    expect(again.level).toBe('word');
    expect(f.mock.calls.length).toBe(calls);
  });

  it('works when storage is switched off', async () => {
    stub({ words: wordsAnswer, ayahs: ayahsAnswer });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('off');
    });
    const { getSurahSync } = await api();
    expect((await getSurahSync('mahmoud-husary/r1', 1)).level).toBe('word');
  });

  it('keeps the sync base address in one constant', async () => {
    const { QURAN_SYNC_BASE } = await api();
    expect(QURAN_SYNC_BASE).toMatch(/^https:\/\//);
  });
});
