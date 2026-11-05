// The lists of lessons the site shows: latest, featured, most viewed, sermons, saved.
import type { Category, Lesson } from '../../types';
import { getCategories, getSeriesByCategory } from './catalog';
import { publishedLessons, rowsOrThrow } from './db';
import { readLessonExtras } from './extras';
import { attachRelations, attachWith } from './relations';
import type { LessonWithRelations } from './shared';

export async function getLatestLessons(limit = 6): Promise<LessonWithRelations[]> {
  const lessons = rowsOrThrow<Lesson>(await publishedLessons().order('published_at', { ascending: false }).limit(limit));
  return attachRelations(lessons);
}

// The lessons the admin pinned, most recently pinned first; the latest lessons stand in when none can be read
export async function getFeaturedLessons(limit = 5): Promise<LessonWithRelations[]> {
  try {
    const ids = (await readLessonExtras()).featured.slice(0, limit);
    if (ids.length > 0) {
      const found = rowsOrThrow<Lesson>(await publishedLessons().in('id', ids));
      if (found.length > 0) {
        const pinned = found.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)).map((l) => ({ ...l, featured: true }));
        return attachRelations(pinned);
      }
    }
  } catch {
    // nothing pinned can be read: fall through to the latest lessons
  }
  return getLatestLessons(limit);
}

export async function getTopViewedLessons(limit = 8): Promise<LessonWithRelations[]> {
  try {
    const lessons = rowsOrThrow<Lesson>(await publishedLessons().order('views', { ascending: false }).limit(limit));
    if (lessons.length > 0) return attachRelations(lessons);
  } catch (err) {
    console.warn('getTopViewedLessons error:', err);
  }
  return getLatestLessons(limit);
}

const isSermonCategory = (c: Category) => c.slug === 'khutab' || c.name.includes('خطب') || c.name.includes('مواعظ');

// The newest lessons of the sermons category; an empty list when there is none
export async function getKhutabLessons(limit = 8): Promise<LessonWithRelations[]> {
  try {
    const category = (await getCategories()).find(isSermonCategory);
    if (!category) return [];
    const series = await getSeriesByCategory(category.id);
    if (series.length === 0) return [];
    const lessons = rowsOrThrow<Lesson>(
      await publishedLessons()
        .in('series_id', series.map((s) => s.id))
        .order('published_at', { ascending: false })
        .limit(limit)
    );
    return attachWith(lessons, series, [category]);
  } catch (err) {
    console.warn('getKhutabLessons error:', err);
    return [];
  }
}

// The lessons a visitor saved, in the order they were saved
export async function getBookmarkedLessons(ids: string[] = []): Promise<LessonWithRelations[]> {
  if (ids.length === 0) return [];
  const lessons = rowsOrThrow<Lesson>(await publishedLessons().in('id', ids));
  return (await attachRelations(lessons)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}
