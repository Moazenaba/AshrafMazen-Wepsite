import { describe, expect, it } from 'vitest';
import { playlistFiles } from './mediaDownload';

describe('playlist downloads', () => {
  it('lists the files of one kind, numbered, and counts the videos without one', () => {
    const videos = [
      { id: 'a', title: 'أول', files: { audio: 'https://f/a.mp3' } },
      { id: 'b', title: 'ثان' },
      { id: 'c', title: 'ثالث', files: { audio: 'https://f/c.mp3', video: 'https://f/c.mp4' } },
    ];
    expect(playlistFiles(videos, 'audio')).toEqual({
      items: [{ url: 'https://f/a.mp3', name: '01 - أول' }, { url: 'https://f/c.mp3', name: '03 - ثالث' }],
      missing: 1,
    });
    expect(playlistFiles(videos, 'video').items).toHaveLength(1);
  });
});
