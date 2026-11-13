import { describe, expect, it } from 'vitest';
import { category, lesson, series } from '../../test/factories';
import { bundleContent, bundleSettings, buildHomeLists, isSiteBundle, type SiteBundle } from './siteBundleRules';

const bundle = (over: Partial<SiteBundle> = {}): SiteBundle => ({
  updatedAt: '2026-11-13T00:00:00Z',
  settings: [],
  categories: [category({ id: 'c1' }), category({ id: 'c2', name: 'خطب الجمعة', slug: 'khutab' })],
  series: [series({ id: 's1', category_id: 'c1' }), series({ id: 's2', category_id: 'c2' })],
  lessons: [
    lesson({ id: 'a', series_id: 's2', views: 1 }),
    lesson({ id: 'b', series_id: 's1', views: 9 }),
    lesson({ id: 'c', series_id: 's1', views: 4 }),
  ],
  social: [],
  ...over,
});

describe('buildHomeLists', () => {
  it('counts each science and keeps its newest lesson', () => {
    const [first, second] = buildHomeLists(bundle()).categories;
    expect([first.lessonCount, first.seriesCount, first.recentLessons.map((l) => l.id)]).toEqual([2, 1, ['b']]);
    expect(second.recentLessons[0].category?.id).toBe('c2');
  });

  it('orders the most viewed and finds the sermons', () => {
    const lists = buildHomeLists(bundle());
    expect(lists.viewedList.map((l) => l.id)).toEqual(['b', 'c', 'a']);
    expect(lists.sermonList.map((l) => l.id)).toEqual(['a']);
    expect(lists.latestList[0].series?.id).toBe('s2');
  });

  it('puts the pinned lessons first, in the order they were pinned, else the latest', () => {
    expect(buildHomeLists(bundle()).featuredList.map((l) => l.id)).toEqual(['a', 'b', 'c']);
    const pinned = bundle({ settings: [{ key: 'lesson_extras', value: JSON.stringify({ featured: ['c', 'zz', 'b'] }) }] });
    const featured = buildHomeLists(pinned).featuredList;
    expect(featured.map((l) => [l.id, l.featured])).toEqual([['c', true], ['b', true]]);
  });

  it('gives empty lists when there is nothing', () => {
    const lists = buildHomeLists(bundle({ categories: [], series: [], lessons: [] }));
    expect([lists.featuredList, lists.latestList, lists.viewedList, lists.sermonList, lists.categories]).toEqual([[], [], [], [], []]);
  });
});

describe('bundle settings and texts', () => {
  it('falls back to the built-in values', () => {
    const b = bundle({ settings: [{ key: 'banner_name', value: 'الاسم' }] });
    expect(bundleSettings(b).banner_name).toBe('الاسم');
    expect(bundleSettings(bundle()).banner_name).toBeTruthy();
    expect(bundleContent(bundle()).feature.enabled).toBe(false);
  });

  it('rejects an answer that is not a bundle', () => {
    expect(isSiteBundle({ error: 'upstream' })).toBe(false);
    expect(isSiteBundle(bundle())).toBe(true);
  });
});
