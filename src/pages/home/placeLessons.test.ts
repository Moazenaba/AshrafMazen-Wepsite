import { describe, expect, it } from 'vitest';
import { related } from '../../test/factories';
import type { CategoryWithPortalData } from '../../services/dataService';
import { placeLessons, type PlacementInput } from './placeLessons';

const L = (id: string, extra: Parameters<typeof related>[0] = {}) => related({ id, title: id, ...extra });
const ids = (list: { id: string }[]) => list.map((l) => l.id);

const base = (over: Partial<PlacementInput> = {}): PlacementInput => ({
  featuredList: [],
  categories: [],
  latestList: [],
  viewedList: [],
  sermonList: [],
  recentLesson: null,
  ...over,
});

describe('placeLessons (each lesson appears once on the home page)', () => {
  it('puts the first featured lesson in the featured block', () => {
    const placed = placeLessons(base({ featuredList: [L('f1'), L('f2')] }));
    expect(placed.featured?.id).toBe('f1');
  });

  it('does not repeat the featured lesson in the latest list', () => {
    const placed = placeLessons(base({ featuredList: [L('a')], latestList: [L('a'), L('b'), L('c')] }));
    expect(ids(placed.newest)).toEqual(['b', 'c']);
  });

  it('does not repeat a lesson across sections, in order: latest, most viewed, sermons', () => {
    const placed = placeLessons(base({ latestList: [L('a'), L('b')], viewedList: [L('b'), L('c')], sermonList: [L('c'), L('d')] }));
    expect(ids(placed.newest)).toEqual(['a', 'b']);
    expect(ids(placed.viewed)).toEqual(['c']);
    expect(ids(placed.sermons)).toEqual(['d']);
  });

  it('keeps the continue-watching lesson out of the lists (it has its own card)', () => {
    const placed = placeLessons(base({ latestList: [L('a'), L('b')], recentLesson: { id: 'a', title: 'a', openedAt: 1 } }));
    expect(ids(placed.newest)).toEqual(['b']);
  });

  it('does not reserve a channel video that is being continued (its id starts with yt:)', () => {
    const placed = placeLessons(base({ latestList: [L('a')], recentLesson: { id: 'yt:abc', title: 'v', openedAt: 1 } }));
    expect(ids(placed.newest)).toEqual(['a']);
  });

  it('limits each section', () => {
    // Different lessons in each list, so only the limits (not the "once" rule) decide the sizes
    const many = (prefix: string) => ['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => L(prefix + n));
    const placed = placeLessons(base({ latestList: many('a'), viewedList: many('v'), sermonList: many('s') }));
    expect(placed.newest).toHaveLength(4);
    expect(placed.viewed).toHaveLength(3);
    expect(placed.sermons).toHaveLength(4);
  });

  it('takes the sidebar video from lessons not placed yet, and only one that has a video', () => {
    const placed = placeLessons(
      base({ latestList: [L('a'), L('b'), L('c'), L('d'), L('e', { youtube_url: '' }), L('f', { youtube_url: 'https://youtu.be/loVFoAlqeCc' })] })
    );
    expect(ids(placed.newest)).toEqual(['a', 'b', 'c', 'd']);
    expect(placed.video?.id).toBe('f');
  });

  it('gives each category with lessons its newest lesson, and skips empty categories', () => {
    const category = (id: string, count: number, recent: string[]): CategoryWithPortalData => ({
      id,
      name: id,
      slug: id,
      sort_order: 1,
      color: 'emerald',
      icon: 'BookOpen',
      seriesCount: 1,
      lessonCount: count,
      recentLessons: recent.map((r) => L(r)),
    });
    const placed = placeLessons(base({ categories: [category('c1', 2, ['x']), category('c2', 0, [])] }));
    expect(placed.categoryBlocks).toHaveLength(1);
    expect(placed.categoryBlocks[0].newest?.id).toBe('x');
  });
});
