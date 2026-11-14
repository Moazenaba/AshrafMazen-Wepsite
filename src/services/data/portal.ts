// The home page's sciences: each category with its counts and its newest lessons.
import type { Category, Lesson } from '../../types';
import { getAllSeries, getCategories } from './catalog';
import { publishedLessons, rowsOrThrow } from './db';
import { attachWith } from './relations';
import { withLessonPictures } from './extras';
import type { LessonWithRelations } from './shared';

export interface CategoryWithPortalData extends Category {
  seriesCount: number;
  lessonCount: number;
  recentLessons: LessonWithRelations[];
}

export async function getCategoriesWithPortalData(recentLimit = 5): Promise<CategoryWithPortalData[]> {
  const [categories, allSeries, lessonsResult] = await Promise.all([
    getCategories(),
    getAllSeries(),
    publishedLessons().order('published_at', { ascending: false }),
  ]);
  // With each lesson's own picture
  const lessons = await withLessonPictures(rowsOrThrow<Lesson>(lessonsResult));

  return categories.map((category) => {
    const series = allSeries.filter((s) => s.category_id === category.id);
    const seriesIds = new Set(series.map((s) => s.id));
    const ofCategory = lessons.filter((l) => seriesIds.has(l.series_id));
    return {
      ...category,
      seriesCount: series.length,
      lessonCount: ofCategory.length,
      recentLessons: attachWith(ofCategory.slice(0, recentLimit), series, [category]),
    };
  });
}
