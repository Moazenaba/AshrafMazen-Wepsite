import { describe, expect, it } from 'vitest';
import { applyOverrides, orderPlaylists, type SitePlaylist } from './libraryOverrides';
import type { YoutubeOverrides } from '../services/data/youtube';

const o = (over: Partial<YoutubeOverrides> = {}): YoutubeOverrides => ({
  hiddenPlaylists: [], hiddenVideos: [], videoTitles: {}, playlistTitles: {}, extraPlaylists: [], extraVideos: [],
  playlistAdditions: {}, playlistOrder: [], mediaFiles: {}, playlistRemovals: {}, videoOrder: {}, playlistCategories: {}, ...over,
});
const lib = (): SitePlaylist[] => [
  { id: 'p1', title: 'one', count: '', latestVideoId: 'a', videos: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] },
  { id: 'p2', title: 'two', count: '', latestVideoId: 'c', videos: [{ id: 'c', title: 'C' }] },
];

describe('library overrides', () => {
  it('a removed video stays removed while new ones still show', () => {
    const withNew = lib();
    withNew[0].videos.unshift({ id: 'n', title: 'New' });
    const result = applyOverrides(withNew, o({ hiddenVideos: ['a'] }));
    expect(result[0].videos.map((v) => v.id)).toEqual(['n', 'b']);
  });

  it('what the admin removed stays removed when YouTube gives it again, in any playlist, found or not', () => {
    // YouTube's data brings back the removed video 'a', in its old playlist and in a playlist found on the channel later
    const again = lib();
    again.push({ id: 'found', title: 'found later', count: '', latestVideoId: 'a', videos: [{ id: 'a', title: 'A' }, { id: 'z', title: 'Z' }] });
    const result = applyOverrides(again, o({ hiddenVideos: ['a'] }));
    expect(result.flatMap((p) => p.videos.map((v) => v.id))).not.toContain('a');
    expect(result.find((p) => p.id === 'found')?.videos.map((v) => v.id)).toEqual(['z']);
  });

  it('a playlist the admin hid stays hidden, also when it was found on the channel by itself', () => {
    const again = lib();
    again.push({ id: 'found', title: 'found later', count: '', latestVideoId: 'z', videos: [{ id: 'z', title: 'Z' }] });
    expect(applyOverrides(again, o({ hiddenPlaylists: ['found'] })).map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('a video taken out of one playlist stays out of it when YouTube gives it again, and stays in the others', () => {
    const again = lib();
    again[1].videos.push({ id: 'a', title: 'A' });
    const result = applyOverrides(again, o({ playlistRemovals: { p1: ['a'] } }));
    expect(result[0].videos.map((v) => v.id)).toEqual(['b']);
    expect(result[1].videos.map((v) => v.id)).toContain('a');
  });

  it('adds the admin videos to the top of a playlist, once', () => {
    const result = applyOverrides(lib(), o({ playlistAdditions: { p2: [{ id: 'up-1', title: 'Upload', src: 'https://f/v.mp4', kind: 'video' }, { id: 'c', title: 'C' }] } }));
    expect(result[1].videos.map((v) => v.id)).toEqual(['up-1', 'c']);
    expect(result[1].videos[0].files).toEqual({ video: 'https://f/v.mp4' });
  });

  it('attaches the admin files to a YouTube video', () => {
    const result = applyOverrides(lib(), o({ mediaFiles: { b: { audio: 'https://f/b.mp3' } } }));
    expect(result[0].videos[1].files).toEqual({ audio: 'https://f/b.mp3' });
    expect(result[0].videos[0].files).toBeUndefined();
  });

  it('orders playlists as the admin chose', () => {
    expect(applyOverrides(lib(), o({ playlistOrder: ['p2'] })).map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(orderPlaylists([{ id: 'x' }, { id: 'y' }, { id: 'z' }], ['z', 'x']).map((p) => p.id)).toEqual(['z', 'x', 'y']);
  });
});
