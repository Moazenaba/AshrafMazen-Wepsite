import { describe, expect, it } from 'vitest';
import { category, related, series } from '../../test/factories';
import type { LibraryPlaylist } from '../../data/youtube-library';
import type { CategoryWithPortalData } from '../../services/dataService';
import { buildCategoryOptions, buildLatestItems } from './latestFeed';
import { JUMUAH_PLAYLIST_ID } from './sermons';

const playlist = (id: string, title: string, videos: { id: string; title: string; published: string }[]): LibraryPlaylist =>
  ({ id, title, count: `${videos.length} فيديو`, latestVideoId: videos[0]?.id ?? '', videos }) as LibraryPlaylist;

describe('buildLatestItems', () => {
  it('lists lessons and the newest three videos of each playlist, newest first', () => {
    const items = buildLatestItems(
      [related({ id: 'l1', title: 'درس', published_at: '2026-03-01T00:00:00Z', category: category({ name: 'العقيدة' }) })],
      [
        playlist('p1', 'قائمة', [
          { id: 'v1', title: 'أ', published: '2026-04-01T00:00:00Z' },
          { id: 'v2', title: 'ب', published: '2026-02-01T00:00:00Z' },
          { id: 'v3', title: 'ج', published: '2026-01-01T00:00:00Z' },
          { id: 'v4', title: 'د', published: '2025-01-01T00:00:00Z' },
        ]),
      ]
    );
    expect(items.map((i) => i.id)).toEqual(['yt:v1', 'l1', 'yt:v2', 'yt:v3']);
  });

  it('files a lesson of the sermons category under the sermons playlist', () => {
    const [item] = buildLatestItems([related({ id: 'l1', category: category({ name: 'الخطب' }), series: series() })], []);
    expect(item.category).toBe(`pl:${JUMUAH_PLAYLIST_ID}`);
  });

  it('files other lessons under their category name, and a lesson with no category under nothing', () => {
    const items = buildLatestItems([related({ id: 'a', category: category({ name: 'الفقه' }) }), related({ id: 'b' })], []);
    expect(items.find((i) => i.id === 'a')?.category).toBe('db:الفقه');
    expect(items.find((i) => i.id === 'b')?.category).toBe('');
  });

  it('links a lesson to its page and a video to its page with its playlist', () => {
    const items = buildLatestItems([related({ id: 'l1' })], [playlist('p1', 'ق', [{ id: 'v1', title: 'أ', published: '2026-01-01T00:00:00Z' }])]);
    expect(items.find((i) => i.id === 'l1')?.href).toBe('/lesson/l1');
    expect(items.find((i) => i.id === 'yt:v1')?.href).toBe('/video/v1?list=p1');
  });
});

describe('buildCategoryOptions', () => {
  const cat = (name: string): CategoryWithPortalData => ({ ...category({ name }), seriesCount: 1, lessonCount: 1, recentLessons: [] });
  it('offers each category except the sermons one, then every playlist', () => {
    const options = buildCategoryOptions([cat('العقيدة'), cat('الخطب')], [playlist('p1', 'قائمة', [])]);
    expect(options).toEqual([
      { value: 'db:العقيدة', label: 'العقيدة' },
      { value: 'pl:p1', label: 'قائمة' },
    ]);
  });
});
