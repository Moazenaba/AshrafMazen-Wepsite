import { describe, expect, it } from 'vitest';
import { EMPTY_OVERRIDES } from '../../../services/data/youtube';
import { applyOverrides, type SitePlaylist } from '../../../lib/libraryOverrides';
import { moveToPlaylist, moveVideo, putBackInPlaylist, takeOutOfPlaylist } from './overridesDraft';

const lib = (): SitePlaylist[] => [
  { id: 'p1', title: 'one', count: '', latestVideoId: 'a', videos: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'c', title: 'C' }] },
  { id: 'p2', title: 'two', count: '', latestVideoId: 'x', videos: [{ id: 'x', title: 'X' }, { id: 'b', title: 'B' }] },
];
const ids = (d: typeof EMPTY_OVERRIDES, pl: string) => applyOverrides(lib(), d).find((p) => p.id === pl)?.videos.map((v) => v.id);

describe('playlist editing', () => {
  it('takes a video out of one playlist only; it stays in the others', () => {
    const d = takeOutOfPlaylist(EMPTY_OVERRIDES, 'p1', 'b');
    expect(ids(d, 'p1')).toEqual(['a', 'c']);
    expect(ids(d, 'p2')).toEqual(['x', 'b']);
    expect(ids(putBackInPlaylist(d, 'p1', 'b'), 'p1')).toEqual(['a', 'b', 'c']);
  });

  it('moves a video to another playlist, at its top', () => {
    const d = moveToPlaylist(EMPTY_OVERRIDES, 'p1', 'p2', { id: 'a', title: 'A' });
    expect(ids(d, 'p1')).toEqual(['b', 'c']);
    expect(ids(d, 'p2')).toEqual(['a', 'x', 'b']);
  });

  it('moving a video back undoes the move', () => {
    const there = moveToPlaylist(EMPTY_OVERRIDES, 'p1', 'p2', { id: 'a', title: 'A' });
    const back = moveToPlaylist(there, 'p2', 'p1', { id: 'a', title: 'A' });
    expect(ids(back, 'p2')).toEqual(['x', 'b']);
    expect(ids(back, 'p1')).toContain('a');
  });

  it('orders the videos inside a playlist', () => {
    const d = moveVideo(EMPTY_OVERRIDES, 'p1', ['a', 'b', 'c'], 2, -1);
    expect(ids(d, 'p1')).toEqual(['a', 'c', 'b']);
    expect(moveVideo(EMPTY_OVERRIDES, 'p1', ['a', 'b', 'c'], 0, -1)).toBe(EMPTY_OVERRIDES);
  });
});
