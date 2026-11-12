import { describe, expect, it } from 'vitest';
import { downloadableOf, hasMedia, stageOfLesson, stageOfVideo } from './stageMedia';
import { modeFrom } from './mediaMode';
import { sourceOf } from '../../lib/mediaDownload';

describe('stageOfVideo', () => {
  it('a channel video plays from YouTube, remembered under yt:<id>', () => {
    expect(stageOfVideo({ id: 'abcdefghijk', title: 'درس' }, 'خطب')).toMatchObject({ trackId: 'yt:abcdefghijk', youtubeId: 'abcdefghijk', href: '/video/abcdefghijk', subtitle: 'خطب' });
  });
  it('an uploaded file plays from the site, not YouTube', () => {
    const s = stageOfVideo({ id: 'up-1', title: 't', src: 'https://x/v.mp4', kind: 'video' });
    expect(s.youtubeId).toBeUndefined();
    expect(s.videoFile).toBe('https://x/v.mp4');
    expect(stageOfVideo({ id: 'up-2', title: 't', src: 'https://x/a.mp3', kind: 'audio' }).audioFile).toBe('https://x/a.mp3');
  });
});

describe('stageOfLesson', () => {
  it("a lesson with a YouTube link and a recording gets both, under the lesson's id", () => {
    const s = stageOfLesson({ id: 'L1', title: 'خطبة', youtube_url: 'https://www.youtube.com/watch?v=abcdefghijk', audio_url: 'https://x/a.mp3' }, 'خطب الجمعة');
    expect(s).toMatchObject({ trackId: 'L1', youtubeId: 'abcdefghijk', audioFile: 'https://x/a.mp3', href: '/lesson/L1' });
    expect(hasMedia(s)).toBe(true);
  });
  it('a lesson with only a transcript has no media', () => {
    expect(hasMedia(stageOfLesson({ id: 'L2', title: 't', youtube_url: '', audio_url: null }))).toBe(false);
  });
  it('downloads: the recording as sound, YouTube as video', () => {
    const d = downloadableOf(stageOfLesson({ id: 'L1', title: 't', youtube_url: 'https://youtu.be/abcdefghijk', audio_url: 'https://x/a.mp3' }));
    expect(sourceOf(d, 'audio')).toMatchObject({ type: 'file', url: 'https://x/a.mp3' });
    expect(sourceOf(d, 'video')).toMatchObject({ type: 'youtube', id: 'abcdefghijk' });
  });
});

describe('modeFrom', () => {
  it('a link asking for listening wins over the last choice', () => {
    expect(modeFrom('listen', 'watch')).toBe('listen');
    expect(modeFrom(null, 'listen')).toBe('listen');
    expect(modeFrom(null, null)).toBe('watch');
  });
});
