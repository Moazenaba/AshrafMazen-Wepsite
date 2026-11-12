import { describe, expect, it } from 'vitest';
import { isYoutubeTrackId, listenKind, siteAudioOf, youtubeTrackId } from './youtubeAudio';

describe('youtube audio', () => {
  it('keeps a channel video under its yt: id', () => {
    expect(youtubeTrackId('abcdefghijk')).toBe('yt:abcdefghijk');
    expect(isYoutubeTrackId('yt:abcdefghijk')).toBe(true);
    expect(isYoutubeTrackId('8f0c2b6e-lesson')).toBe(false);
  });

  it('asks for the original sound when the browser plays WebM/Opus, else an MP3', () => {
    expect(listenKind(() => 'probably')).toBe('listen');
    expect(listenKind(() => '')).toBe('audio');
  });

  it("plays the site's own file first", () => {
    const base = { id: 'abcdefghijk', title: 't' } as any;
    expect(siteAudioOf({ ...base, files: { audio: 'https://x/a.mp3' } })).toBe('https://x/a.mp3');
    expect(siteAudioOf({ ...base, kind: 'audio', src: 'https://x/b.mp3' })).toBe('https://x/b.mp3');
    expect(siteAudioOf({ ...base, kind: 'video', src: 'https://x/c.mp4' })).toBeUndefined();
    expect(siteAudioOf(base)).toBeUndefined();
  });
});
