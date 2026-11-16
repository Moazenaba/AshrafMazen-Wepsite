// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { autoFillFromVideo, cleanHomeFeature, EMPTY_FEATURE, featureImage, featureStatus, isFeatureShown, validateHomeFeature } from './homeFeatureRules';
import { fetchVideoInfo } from './videoInfo';

const feature = (over: object = {}) => ({ ...EMPTY_FEATURE, enabled: true, ...over });

describe('the picture of the card', () => {
  it('is the admin picture when there is one, even with a video', () => {
    expect(featureImage(feature({ imageUrl: 'https://x.test/a.jpg', videoUrl: 'https://youtu.be/loVFoAlqeCc' }))).toBe('https://x.test/a.jpg');
  });

  it('is the first frame (thumbnail) of a YouTube video when there is no picture', () => {
    expect(featureImage(feature({ videoUrl: 'https://youtu.be/loVFoAlqeCc' }))).toContain('loVFoAlqeCc');
    expect(isFeatureShown(feature({ videoUrl: 'https://youtu.be/loVFoAlqeCc' }))).toBe(true);
  });

  it('is nothing for no picture and a video that is not YouTube', () => {
    expect(featureImage(feature({ videoUrl: '/lesson/abc' }))).toBe('');
    expect(featureStatus(feature({ videoUrl: '/lesson/abc' }))).toBe('no-image');
    expect(validateHomeFeature(feature())).toContain('صورة');
  });
});

describe('the background sound', () => {
  it('is kept, trimmed, and is independent of the picture', () => {
    expect(cleanHomeFeature({ audioUrl: '  /api/r2?file=audio%2Fa.mp3 ' }).audioUrl).toBe('/api/r2?file=audio%2Fa.mp3');
    expect(cleanHomeFeature({}).audioUrl).toBe('');
  });
});

describe('autoFillFromVideo', () => {
  it('fills the empty title and line from the video', () => {
    const filled = autoFillFromVideo(feature(), { title: 'درس التوحيد', author: 'قناة الشيخ' });
    expect([filled.title, filled.subtitle]).toEqual(['درس التوحيد', 'قناة الشيخ']);
  });

  it('never overwrites what the admin wrote', () => {
    const filled = autoFillFromVideo(feature({ title: 'عنواني' }), { title: 'درس', author: 'قناة' });
    expect([filled.title, filled.subtitle]).toEqual(['عنواني', 'قناة']);
  });
});

describe('fetchVideoInfo', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the title and channel from the oEmbed answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ title: ' درس ', author_name: 'قناة' }))));
    expect(await fetchVideoInfo('https://youtu.be/loVFoAlqeCc')).toEqual({ title: 'درس', author: 'قناة' });
  });

  it('is null for a link that is not YouTube, a failed answer, and an offline browser', async () => {
    expect(await fetchVideoInfo('/lesson/abc')).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    expect(await fetchVideoInfo('https://youtu.be/loVFoAlqeCc')).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchVideoInfo('https://youtu.be/loVFoAlqeCc')).toBeNull();
  });
});
