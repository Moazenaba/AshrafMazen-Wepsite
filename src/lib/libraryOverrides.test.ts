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
