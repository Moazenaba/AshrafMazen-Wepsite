import { describe, expect, it } from 'vitest';
import { applyOverrides, type SitePlaylist } from '../src/lib/libraryOverrides';
import { normalizeOverrides, videosSitemap } from './_sitemapVideos';

const SITE = 'https://example.test';
const library = (): SitePlaylist[] => [
  { id: 'PL1', title: 'شرح & كتاب', count: '', latestVideoId: 'aaaaaaaaaaa', videos: [{ id: 'aaaaaaaaaaa', title: 'الدرس <الأول>' }, { id: 'bbbbbbbbbbb', title: 'الدرس الثاني' }] },
  { id: 'PL2', title: 'قائمة ثانية', count: '', latestVideoId: 'aaaaaaaaaaa', videos: [{ id: 'aaaaaaaaaaa', title: 'الدرس <الأول>' }, { id: 'ccccccccccc', title: 'الدرس الثالث' }] },
];

describe('videos sitemap', () => {
  it('lists every playlist and every video once, with its title as the page will have it', () => {
    const xml = videosSitemap(library(), SITE);
    expect(xml).toContain(`<loc>${SITE}/playlist/PL1</loc>`);
    expect(xml).toContain(`<loc>${SITE}/playlist/PL2</loc>`);
    expect((xml.match(/<loc>[^<]*\/video\/aaaaaaaaaaa<\/loc>/g) ?? []).length).toBe(1);
    expect(xml).toContain('<video:title>الدرس &lt;الأول&gt;</video:title>');
    expect(xml).toContain('<video:thumbnail_loc>https://i.ytimg.com/vi/ccccccccccc/hqdefault.jpg</video:thumbnail_loc>');
    expect(xml).toContain('شرح &amp; كتاب');
  });

  it('dates a video only when its true date is known', () => {
    const xml = videosSitemap(library(), SITE, (id) => (id === 'aaaaaaaaaaa' ? '2024-05-01T10:00:00+00:00' : id === 'bbbbbbbbbbb' ? 'not a date' : undefined));
    expect(xml).toContain('<video:publication_date>2024-05-01T10:00:00+00:00</video:publication_date>');
    expect((xml.match(/publication_date/g) ?? []).length).toBe(2);
  });

  it('leaves out files uploaded to the site, and ids that are not video ids', () => {
    const xml = videosSitemap([{ id: 'PL1', title: 'ق', videos: [{ id: 'up-abc', title: 'مرفوع', src: 'https://f/v.mp4' }, { id: 'zzzzzzzzzzz', title: 'مرفوع آخر', src: 'https://f/a.mp3' }, { id: 'short', title: 'x' }, { id: 'ddddddddddd', title: 'سليم' }] }], SITE);
    expect(xml).toContain('/video/ddddddddddd');
    expect(xml).not.toContain('/video/up-abc');
    expect(xml).not.toContain('/video/zzzzzzzzzzz');
    expect(xml).not.toContain('/video/short');
  });

  it("does not list what the admin hid or removed, even when YouTube's data brings it again", () => {
    const shown = applyOverrides(library(), normalizeOverrides({ hiddenVideos: ['ccccccccccc'], hiddenPlaylists: ['PL2'], playlistRemovals: { PL1: ['bbbbbbbbbbb'] } }));
    const xml = videosSitemap(shown, SITE);
    expect(xml).not.toContain('/video/ccccccccccc');
    expect(xml).not.toContain('/video/bbbbbbbbbbb');
    expect(xml).not.toContain('/playlist/PL2');
    expect(xml).toContain('/video/aaaaaaaaaaa');
  });

  it('reads broken settings as no settings', () => {
    expect(normalizeOverrides(null).hiddenVideos).toEqual([]);
    expect(normalizeOverrides({ hiddenVideos: 'x', videoTitles: [] }).videoTitles).toEqual({});
  });
});
