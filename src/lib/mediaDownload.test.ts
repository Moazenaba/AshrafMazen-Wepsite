import { describe, expect, it } from 'vitest';
import { playlistSources, sourceOf } from './mediaDownload';

describe('downloads', () => {
  it('uses the site file first, else the YouTube video', () => {
    expect(sourceOf({ id: 'abcdefghijk', title: 'T', files: { audio: 'https://f/a.mp3' } }, 'audio')).toEqual({ type: 'file', url: 'https://f/a.mp3', name: 'T' });
    expect(sourceOf({ id: 'abcdefghijk', title: 'T' }, 'video')).toEqual({ type: 'youtube', id: 'abcdefghijk', name: 'T' });
  });

  it('has nothing for a site upload without that kind', () => {
    expect(sourceOf({ id: 'up-1', title: 'U', src: 'https://f/u.mp3', kind: 'audio', files: { audio: 'https://f/u.mp3' } }, 'video')).toBeNull();
  });

  it('numbers a playlist and counts what is missing', () => {
    const videos = [
      { id: 'aaaaaaaaaaa', title: 'أول' },
      { id: 'up-2', title: 'مرفوع', src: 'https://f/b.mp3', kind: 'audio' as const, files: { audio: 'https://f/b.mp3' } },
    ];
    const audio = playlistSources(videos, 'audio');
    expect(audio.items.map((s) => s.name)).toEqual(['01 - أول', '02 - مرفوع']);
    expect(playlistSources(videos, 'video').missing).toBe(1);
  });
});

describe('savefrom fallback', () => {
  it('uses their shortcut before the video link', async () => {
    const { savefromUrl } = await import('./mediaDownload');
    expect(savefromUrl('abcdefghijk')).toBe('https://sfrom.net/https://www.youtube.com/watch?v=abcdefghijk');
  });
});
