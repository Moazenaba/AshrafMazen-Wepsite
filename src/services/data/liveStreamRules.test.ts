import { describe, expect, it } from 'vitest';
import { EMPTY_LIVE, cleanLiveStream, isLiveShown, parseLiveStream, telegramHref, validateLiveStream } from './liveStreamRules';

const live = (over = {}) => cleanLiveStream({ enabled: true, youtubeUrl: 'https://www.youtube.com/watch?v=loVFoAlqeCc', ...over });

describe('live stream', () => {
  it('shows only when on and with a working link', () => {
    expect(isLiveShown(live())).toBe(true);
    expect(isLiveShown(live({ enabled: false }))).toBe(false);
    expect(isLiveShown(live({ youtubeUrl: '' }))).toBe(false);
    expect(isLiveShown(live({ youtubeUrl: '', telegramUrl: 't.me/sheikh' }))).toBe(true);
    expect(isLiveShown(live({ youtubeUrl: 'https://youtube.com/live/loVFoAlqeCc' }))).toBe(true);
  });

  it('accepts only Telegram hosts', () => {
    expect(telegramHref('t.me/sheikh')).toBe('https://t.me/sheikh');
    expect(telegramHref('https://www.telegram.me/c/123?livestream')).toBe('https://telegram.me/c/123?livestream');
    expect(telegramHref('https://evil.example/t.me/x')).toBeNull();
    expect(telegramHref('javascript:alert(1)')).toBeNull();
    expect(telegramHref('https://t.me/')).toBeNull();
    expect(telegramHref('')).toBeNull();
  });

  it('explains what is wrong when switched on', () => {
    expect(validateLiveStream(live({ youtubeUrl: '' }))).toMatch(/رابط البث/);
    expect(validateLiveStream(live({ youtubeUrl: 'https://vimeo.com/1' }))).toMatch(/يوتيوب/);
    expect(validateLiveStream(live({ telegramUrl: 'https://example.com' }))).toMatch(/تليجرام/);
    expect(validateLiveStream(live({ enabled: false, youtubeUrl: '' }))).toBeNull();
    expect(validateLiveStream(live())).toBeNull();
  });

  it('reads bad saved data as off', () => {
    expect(parseLiveStream('{bad')).toEqual(EMPTY_LIVE);
    expect(parseLiveStream(null)).toEqual(EMPTY_LIVE);
    expect(parseLiveStream('{"enabled":true,"title":"  بث   اليوم "}').title).toBe('بث اليوم');
  });
});
