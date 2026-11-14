import { describe, expect, it } from 'vitest';
import { EMPTY_LIVE, cleanLiveStream, isLiveShown, liveView, parseLiveStream, telegramHref, validateLiveStream } from './liveStreamRules';

const tg = (over = {}) => cleanLiveStream({ enabled: true, telegramUrl: 't.me/sheikh', ...over });
const auto = { videoId: 'loVFoAlqeCc', title: 'درس مباشر' };

describe('live broadcast', () => {
  it('shows the Sheikh\'s YouTube live only when /api/live found one', () => {
    expect(isLiveShown(liveView(auto, EMPTY_LIVE))).toBe(true);
    expect(liveView(auto, EMPTY_LIVE)).toEqual({ youtubeId: 'loVFoAlqeCc', telegram: null, title: 'درس مباشر' });
    expect(isLiveShown(liveView(null, EMPTY_LIVE))).toBe(false);
    expect(isLiveShown(liveView(undefined, EMPTY_LIVE))).toBe(false);
  });

  it('never shows a YouTube link the admin once saved by hand', () => {
    const old = parseLiveStream('{"enabled":true,"title":"x","youtubeUrl":"https://www.youtube.com/live/ZqhzNg6jPto","telegramUrl":""}');
    expect(isLiveShown(liveView(null, old))).toBe(false);
    expect('youtubeUrl' in old).toBe(false);
  });

  it('ignores a malformed video id from the server', () => {
    expect(isLiveShown(liveView({ videoId: '<script>', title: 'x' }, EMPTY_LIVE))).toBe(false);
  });

  it('shows Telegram only when the admin switched it on with a Telegram link', () => {
    expect(liveView(null, tg()).telegram).toBe('https://t.me/sheikh');
    expect(isLiveShown(liveView(null, tg({ enabled: false })))).toBe(false);
    expect(isLiveShown(liveView(null, tg({ telegramUrl: '' })))).toBe(false);
  });

  it('can show both, with the YouTube title first', () => {
    const v = liveView(auto, tg({ title: 'تليجرام' }));
    expect(v.youtubeId).toBe('loVFoAlqeCc');
    expect(v.telegram).toBe('https://t.me/sheikh');
    expect(v.title).toBe('درس مباشر');
  });

  it('accepts only Telegram hosts', () => {
    expect(telegramHref('t.me/sheikh')).toBe('https://t.me/sheikh');
    expect(telegramHref('https://www.telegram.me/c/123?livestream')).toBe('https://telegram.me/c/123?livestream');
    expect(telegramHref('https://evil.example/t.me/x')).toBeNull();
    expect(telegramHref('javascript:alert(1)')).toBeNull();
    expect(telegramHref('https://t.me/')).toBeNull();
    expect(telegramHref('')).toBeNull();
  });

  it('explains what is wrong when the Telegram switch is on', () => {
    expect(validateLiveStream(tg({ telegramUrl: '' }))).toMatch(/تليجرام/);
    expect(validateLiveStream(tg({ telegramUrl: 'https://example.com' }))).toMatch(/t\.me/);
    expect(validateLiveStream(tg({ enabled: false, telegramUrl: '' }))).toBeNull();
    expect(validateLiveStream(tg())).toBeNull();
  });

  it('reads bad saved data as off', () => {
    expect(parseLiveStream('{bad')).toEqual(EMPTY_LIVE);
    expect(parseLiveStream(null)).toEqual(EMPTY_LIVE);
    expect(parseLiveStream('{"enabled":true,"title":"  بث   اليوم "}').title).toBe('بث اليوم');
  });
});
