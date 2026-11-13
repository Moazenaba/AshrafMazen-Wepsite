import { describe, expect, it } from 'vitest';
import { cobaltRequest, isChannelVideo, parseCobalt, parseInvidious, parsePiped, providersFrom } from './_providers';

describe('download services', () => {
  it('reads the service lists, with keys, and falls back to the built-in ones', () => {
    const list = providersFrom({ COBALT_INSTANCES: 'https://a.example/|k1, https://b.example', PIPED_INSTANCES: 'http://insecure.example' });
    expect(list.filter((p) => p.type === 'cobalt')).toEqual([{ type: 'cobalt', base: 'https://a.example', key: 'k1' }, { type: 'cobalt', base: 'https://b.example' }]);
    expect(list.some((p) => p.base.startsWith('http://'))).toBe(false);
    expect(providersFrom({}).length).toBeGreaterThan(0);
  });

  it('asks cobalt for mp3 or 720p video, with its key', () => {
    const req = cobaltRequest({ type: 'cobalt', base: 'https://a.example', key: 'k' }, 'abcdefghijk', 'audio');
    expect(JSON.parse(String(req.init.body)).downloadMode).toBe('audio');
    expect((req.init.headers as Record<string, string>).Authorization).toBe('Api-Key k');
  });

  it('understands each answer', () => {
    expect(parseCobalt({ status: 'tunnel', url: 'https://t/x', filename: 'a.mp3' })).toEqual({ url: 'https://t/x', filename: 'a.mp3', attachment: true });
    expect(parseCobalt({ status: 'error', error: { code: 'x' } })).toBeNull();
    const inv = parseInvidious({ type: 'invidious', base: 'https://i.example' }, { title: 'T', adaptiveFormats: [{ itag: '140', url: '/videoplayback?x' }] }, 'audio');
    expect(inv?.url).toBe('https://i.example/videoplayback?x');
    expect(parsePiped({ videoStreams: [{ url: 'u1', videoOnly: true }, { url: 'u2', videoOnly: false, quality: '360p' }] }, 'video')?.url).toBe('u2');
    expect(parsePiped({ audioStreams: [] }, 'audio')).toBeNull();
  });

  it('accepts only the channel videos', () => {
    expect(isChannelVideo({ author_url: 'https://www.youtube.com/@Ashrafmazen' }, 'Ashrafmazen', 'UCx')).toBe(true);
    expect(isChannelVideo({ author_url: 'https://www.youtube.com/@other' }, 'Ashrafmazen', 'UCx')).toBe(false);
  });
});

describe('cobaltRequest for listening', () => {
  const relay = 'https://api.cobalt.liubquanti.click';
  it('asks the original sound for listening', () => {
    const body = JSON.parse(String(cobaltRequest({ type: 'cobalt', base: relay } as any, 'abcdefghijk', 'listen').init.body));
    expect(body).toMatchObject({ downloadMode: 'audio', audioFormat: 'best' });
  });
});
