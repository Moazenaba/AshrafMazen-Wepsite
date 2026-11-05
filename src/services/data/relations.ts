// Gives lessons their series and category (written once; every lesson list uses it).
import type { Category, Lesson, Series } from '../../types';
import { getAllSeries, getCategories } from './catalog';
import type { LessonWithRelations } from './shared';

// Pure: attaches already-loaded series and categories
export function attachWith<T extends Lesson>(
  lessons: T[],
  series: Series[],
  categories: Category[]
): (T & Pick<LessonWithRelations, 'series' | 'category'>)[] {
  const seriesById = new Map(series.map((s) => [s.id, s]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return lessons.map((lesson) => {
    const lessonSeries = seriesById.get(lesson.series_id) || null;
    const category = lessonSeries ? categoryById.get(lessonSeries.category_id) || null : null;
    return { ...lesson, series: lessonSeries, category };
  });
}

// Loads the series and categories (only when there are lessons) and attaches them
export async function attachRelations<T extends Lesson>(lessons: T[]) {
  if (lessons.length === 0) return [];
  const [series, categories] = await Promise.all([getAllSeries(), getCategories()]);
  return attachWith(lessons, series, categories);
}
