import { beforeEach, describe, expect, it } from 'vitest';
import { db, installFakeDatabase, resetFakeDatabase } from '../../test/fakeDatabase';
import { buildHomeLists, type SiteBundle } from './siteBundleRules';
import { getFeaturedLessons, getLatestLessons } from './lessonLists';
import { getCategoriesWithPortalData } from './portal';

// INT-08: the one /api/site answer and the separate queries must give the home page the same lessons, same order, same picture.
const later = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

function setup() {
  resetFakeDatabase();
  installFakeDatabase();
  const base = db.lessons[0];
  db.lessons.push(
    { ...base, id: 'lesson-3', lesson_number: 3, title: 'الثالث', status: 'published', published_at: later(5), views: 10 },
    { ...base, id: 'lesson-4', lesson_number: 4, title: 'الرابع', status: 'published', published_at: later(2), views: 99 },
  );
  db.site_settings.push({
    key: 'lesson_extras',
    value: JSON.stringify({ featured: ['lesson-4', 'lesson-3'], chapters: {}, images: { 'lesson-3': 'https://x.test/p.jpg' } }),
  });
}

function bundle(): SiteBundle {
  const published = db.lessons.filter((l) => l.status === 'published').sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
  return {
    updatedAt: new Date().toISOString(),
    settings: db.site_settings.map((r) => ({ key: r.key, value: r.value })),
    categories: db.categories as any,
    series: db.series as any,
    lessons: published as any,
    social: db.social_links as any,
  };
}

const view = (list: { id: string; image?: string | null }[]) => list.map((l) => [l.id, l.image ?? null]);

describe('bundle and direct queries agree', () => {
  beforeEach(setup);

  it('latest lessons: same ids, order and image', async () => {
    expect(view(buildHomeLists(bundle()).latestList)).toEqual(view(await getLatestLessons(30)));
  });

  it('featured lessons: same ids, order and image', async () => {
    const direct = await getFeaturedLessons(3);
    expect(view(buildHomeLists(bundle()).featuredList)).toEqual(view(direct));
    expect(direct.map((l) => l.id)).toEqual(['lesson-4', 'lesson-3']);
  });

  it('categories: same counts and recent lessons', async () => {
    const direct = await getCategoriesWithPortalData(1);
    const fromBundle = buildHomeLists(bundle()).categories;
    expect(fromBundle.map((c) => [c.id, c.seriesCount, c.lessonCount, view(c.recentLessons)])).toEqual(
      direct.map((c) => [c.id, c.seriesCount, c.lessonCount, view(c.recentLessons)]),
    );
  });

  it('a lesson picture reaches both paths', async () => {
    const direct = await getLatestLessons(30);
    expect(direct.find((l) => l.id === 'lesson-3')?.image).toBe('https://x.test/p.jpg');
  });
});
