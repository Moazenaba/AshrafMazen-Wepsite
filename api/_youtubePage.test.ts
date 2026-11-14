import { describe, expect, it } from 'vitest';
import { continuationIn, innertubeOf, parsePlaylists, parseVideos, videosIn, withArabic } from './_youtubePage';

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

describe('parsePlaylists', () => {
  it('reads the playlists of the channel page, each once; videos and other things are left out', () => {
    const html = page({
      contents: [
        lockup('PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', 'خطب الجمعة', 'LOCKUP_CONTENT_TYPE_PLAYLIST'),
        lockup('PLHcd1VuAeT_OaS9laiTEk1qiTT4Tvcm2E', 'سؤال وجواب', 'LOCKUP_CONTENT_TYPE_PODCAST'),
        lockup('PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', 'مرة ثانية', 'LOCKUP_CONTENT_TYPE_PLAYLIST'),
        lockup('aaaaaaaaaaa', 'فيديو'),
        lockup('short', 'x', 'LOCKUP_CONTENT_TYPE_PLAYLIST'),
      ],
    });
    expect(parsePlaylists(html)).toEqual([
      { id: 'PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', title: 'خطب الجمعة' },
      { id: 'PLHcd1VuAeT_OaS9laiTEk1qiTT4Tvcm2E', title: 'سؤال وجواب' },
    ]);
  });
});

describe('long playlists and language', () => {
  it('finds the next-page token in the old and the new layout', () => {
    expect(continuationIn({ a: [{ continuationItemRenderer: { continuationEndpoint: { continuationCommand: { token: 'T1' } } } }] })).toBe('T1');
    expect(continuationIn({ continuationItemRenderer: { continuationEndpoint: { commandExecutorCommand: { commands: [{ x: 1 }, { continuationCommand: { token: 'T2' } }] } } } })).toBe('T2');
    expect(continuationIn({ nothing: true })).toBeNull();
  });

  it('reads videos from the answer for a next page', () => {
    const answer = { onResponseReceivedActions: [{ appendContinuationItemsAction: { continuationItems: [{ playlistVideoRenderer: { videoId: 'loVFoAlqeCc', title: { runs: [{ text: 'درس' }] } } }] } }] };
    expect(videosIn(answer)).toEqual([{ id: 'loVFoAlqeCc', title: 'درس' }]);
  });

  it('reads the client key and version from the page', () => {
    expect(innertubeOf('x"INNERTUBE_API_KEY":"K1",y"INNERTUBE_CLIENT_VERSION":"2.2026"')).toEqual({ key: 'K1', version: '2.2026' });
    expect(innertubeOf('<html></html>')).toBeNull();
  });

  it('asks YouTube for the Arabic page', () => {
    expect(withArabic('https://www.youtube.com/playlist?list=PL1')).toBe('https://www.youtube.com/playlist?list=PL1&hl=ar&gl=EG');
    expect(withArabic('https://www.youtube.com/channel/UC1/videos')).toBe('https://www.youtube.com/channel/UC1/videos?hl=ar&gl=EG');
  });
});
