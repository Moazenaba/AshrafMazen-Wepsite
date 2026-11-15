import { afterEach, describe, expect, it, vi } from 'vitest';

const NEW_LIST = 'PLnewlistnewlistnewlistnewlistnew1';
const page = (data: unknown) => `<script>var ytInitialData = ${JSON.stringify(data)};</script>`;
const lockup = (id: string, title: string, type: string) => ({ lockupViewModel: { contentId: id, contentType: type, metadata: { lockupMetadataViewModel: { title: { content: title } } } } });
const video = (id: string, title: string) => lockup(id, title, 'LOCKUP_CONTENT_TYPE_VIDEO');

// A pretend YouTube: the RSS feeds answer 404 (as they do now), the pages answer
function pretendYoutube(playlists: [string, string][], uploads: [string, string][], playlistVideos: Record<string, [string, string][]>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: any) => {
      const url = String(input);
      // Every page is asked for in Arabic (?hl=ar&gl=EG), so the address is matched by its path
      const path = url.startsWith('http') ? new URL(url).pathname : url;
      const ok = (body: string) => ({ ok: true, status: 200, text: async () => body, json: async () => ({}) });
      if (url.includes('/feeds/videos.xml')) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
      if (path.endsWith('/playlists')) return ok(page({ items: playlists.map(([id, title]) => lockup(id, title, 'LOCKUP_CONTENT_TYPE_PLAYLIST')) }));
      if (path.endsWith('/videos')) return ok(page({ items: uploads.map(([id, title]) => video(id, title)) }));
      const list = url.match(/playlist\?list=([^&]+)/)?.[1] ?? '';
      return ok(page({ items: (playlistVideos[list] ?? []).map(([id, title]) => video(id, title)) }));
    })
  );
}

async function library() {
  vi.resetModules();
  const handler = (await import('./youtube-library')).default;
  let body = '';
  await handler({}, { setHeader() {}, status() { return this; }, send(b: string) { body = b; } });
  return JSON.parse(body) as { playlists: { id: string; title: string; videos: { id: string; title: string }[] }[] };
}

afterEach(() => vi.unstubAllGlobals());

describe('youtube library function', () => {
  it('puts the playlists in the order of the channel page', async () => {
    const { YOUTUBE_LIBRARY } = await import('../src/data/youtube-library');
    const last = YOUTUBE_LIBRARY[YOUTUBE_LIBRARY.length - 1];
    pretendYoutube([[last.id, last.title], [NEW_LIST, 'سلسلة جديدة']], [], { [NEW_LIST]: [['nnnnnnnnnn1', 'حلقة']] });
    const result = await library();
    const ids = result.playlists.map((p) => p.id);
    expect(ids.slice(0, 2)).toEqual([last.id, NEW_LIST]);
  }, 20_000);

  it('adds a playlist made on the channel since the saved library, with its videos', async () => {
    const { YOUTUBE_LIBRARY } = await import('../src/data/youtube-library');
    pretendYoutube(
      [...YOUTUBE_LIBRARY.map((p) => [p.id, p.title] as [string, string]), [NEW_LIST, 'سلسلة جديدة']],
      [],
      { [NEW_LIST]: [['nnnnnnnnnn1', 'الحلقة الأولى'], ['nnnnnnnnnn2', 'الحلقة الثانية']] }
    );
    const result = await library();
    const added = result.playlists.find((p) => p.id === NEW_LIST);
    expect(added?.title).toBe('سلسلة جديدة');
    expect(added?.videos.map((v) => v.id)).toEqual(['nnnnnnnnnn1', 'nnnnnnnnnn2']);
    // First to import the large saved library: slow on a busy machine, so a longer limit than the default 5 s
  }, 20_000);

  it('lists the channel uploads that no playlist has, first', async () => {
    pretendYoutube([], [['uuuuuuuuuu1', 'مرفوع حديثًا']], {});
    const result = await library();
    expect(result.playlists[0]).toMatchObject({ id: 'channel-latest' });
    expect(result.playlists[0].videos.map((v) => v.id)).toEqual(['uuuuuuuuuu1']);
  });

  it('asks YouTube for every page in Arabic', async () => {
    pretendYoutube([], [], {});
    await library();
    const urls: string[] = (globalThis.fetch as any).mock.calls.map((call: any[]) => String(call[0])).filter((u: string) => u.includes('youtube.com'));
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toContain('hl=ar');
  });

  it('asks YouTube for two pages only: no RSS feed, no re-reading of the saved playlists', async () => {
    pretendYoutube([], [], {});
    await library();
    const urls: string[] = (globalThis.fetch as any).mock.calls.map((call: any[]) => String(call[0])).filter((u: string) => u.includes('youtube.com'));
    expect(urls.some((u) => u.includes('/feeds/videos.xml'))).toBe(false);
    expect(urls.filter((u) => u.includes('playlist?list='))).toEqual([]);
    expect(urls).toHaveLength(2);
  });

  it('keeps the saved library when YouTube gives nothing at all', async () => {
    pretendYoutube([], [], {});
    const { YOUTUBE_LIBRARY } = await import('../src/data/youtube-library');
    const result = await library();
    expect(result.playlists.length).toBe(YOUTUBE_LIBRARY.length);
  });
});
