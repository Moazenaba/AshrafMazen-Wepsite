import { describe, expect, it } from 'vitest';
import { parseVideos } from './_youtubePage';

const page = (data: unknown) => `<html><script>var ytInitialData = ${JSON.stringify(data)};</script></html>`;
const lockup = (id: string, title: string, type = 'LOCKUP_CONTENT_TYPE_VIDEO') => ({ lockupViewModel: { contentId: id, contentType: type, metadata: { lockupMetadataViewModel: { title: { content: title } } } } });

describe('parseVideos', () => {
  it('reads the new lockup shape in the page order, each video once', () => {
    const html = page({ a: { items: [lockup('aaaaaaaaaaa', 'الأول'), lockup('bbbbbbbbbbb', 'الثاني'), lockup('aaaaaaaaaaa', 'الأول مرة ثانية')] } });
    expect(parseVideos(html)).toEqual([{ id: 'aaaaaaaaaaa', title: 'الأول' }, { id: 'bbbbbbbbbbb', title: 'الثاني' }]);
  });

  it('reads the playlist and list renderers too', () => {
    const html = page({ contents: [{ playlistVideoRenderer: { videoId: 'ccccccccccc', title: { runs: [{ text: 'عنوان ' }, { text: 'طويل' }] } } }, { richItemRenderer: { content: { videoRenderer: { videoId: 'ddddddddddd', title: { simpleText: 'درس' } } } } }] });
    expect(parseVideos(html)).toEqual([{ id: 'ccccccccccc', title: 'عنوان طويل' }, { id: 'ddddddddddd', title: 'درس' }]);
  });

  it('leaves out playlists and other things that are not videos, and ids that are not video ids', () => {
    const html = page({ contents: [lockup('PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', 'قائمة', 'LOCKUP_CONTENT_TYPE_PLAYLIST'), lockup('short', 'x')] });
    expect(parseVideos(html)).toEqual([]);
  });

  it('gives nothing for a page without data, or with broken data', () => {
    expect(parseVideos('<html>consent</html>')).toEqual([]);
    expect(parseVideos('<script>var ytInitialData = {oops;</script>')).toEqual([]);
  });
});
