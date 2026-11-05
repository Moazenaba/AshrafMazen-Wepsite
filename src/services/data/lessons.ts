// Reading lessons: lists, search, featured, bookmarks, portal data.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { normalizeArabic } from '../../utils/helpers';
import type { Category, Lesson } from '../../types';
import { getAllSeries, getCategories, getSeriesByCategory } from './catalog';
import { readLessonExtras, withExtras } from './extras';
import type { LessonWithRelations } from './shared';

export async function getLessonsBySeries(
  seriesId: string,
  includeDrafts = false
): Promise<Lesson[]> {
  try {
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('series_id', seriesId)
      .order('lesson_number', { ascending: true });

    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error) throw new Error(translateSupabaseError(error));
    return data || [];
  } catch (err) {
    console.error('getLessonsBySeries error:', err);
    throw err;
  }
}

export async function getLesson(
  lessonId: string,
  includeDrafts = false
): Promise<Lesson | null> {
  try {
    let query = supabase.from('lessons').select('*').eq('id', lessonId);

    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(translateSupabaseError(error));
    if (!data) return null;
    return withExtras(data as Lesson, await readLessonExtras());
  } catch (err) {
    console.error('getLesson error:', err);
    throw err;
  }
}

export async function incrementLessonViews(lessonId: string): Promise<void> {
  if (!lessonId) return;
  try {
    const sessionKey = `viewed_lesson_${lessonId}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem(sessionKey)) {
        return; // already viewed in this browser session
      }
      sessionStorage.setItem(sessionKey, '1');
    }
    const { error } = await supabase.rpc('increment_lesson_views', { lesson_id: lessonId });
    if (error) {
      console.warn('increment_lesson_views RPC notice:', error.message);
    }
  } catch (err) {
    console.warn('incrementLessonViews error:', err);
  }
}

export async function getLatestLessons(limit = 6): Promise<LessonWithRelations[]> {
  try {
    // Fetch latest published lessons
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(translateSupabaseError(error));
    if (!lessons || lessons.length === 0) return [];

    // Attach series and categories
    const allSeries = await getAllSeries();
    const allCategories = await getCategories();
    const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
    const catMap = new Map(allCategories.map((c) => [c.id, c]));

    return lessons.map((l) => {
      const s = seriesMap.get(l.series_id) || null;
      const c = s ? catMap.get(s.category_id) || null : null;
      return {
        ...l,
        series: s,
        category: c,
      };
    });
  } catch (err) {
    console.error('getLatestLessons error:', err);
    throw err;
  }
}

export async function getFeaturedLessons(limit = 5): Promise<LessonWithRelations[]> {
  try {
    // The lessons the admin pinned, most recently pinned first
    const { featured } = await readLessonExtras();
    const ids = featured.slice(0, limit);
    const { data: found, error } = ids.length
      ? await supabase.from('lessons').select('*').eq('status', 'published').in('id', ids)
      : { data: [] as Lesson[], error: null };
    const lessons = (found || []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)).map((l) => ({ ...l, featured: true }));

    if (!error && lessons && lessons.length > 0) {
      const allSeries = await getAllSeries();
      const allCategories = await getCategories();
      const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
      const catMap = new Map(allCategories.map((c) => [c.id, c]));

      return lessons.map((l) => {
        const s = seriesMap.get(l.series_id) || null;
        const c = s ? catMap.get(s.category_id) || null : null;
        return {
          ...l,
          series: s,
          category: c,
        };
      });
    }
  } catch {
    // Nothing pinned can be read: the latest lessons stand in
  }
  return getLatestLessons(limit);
}

export async function getTopViewedLessons(limit = 8): Promise<LessonWithRelations[]> {
  try {
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(limit);

    if (!error && lessons && lessons.length > 0) {
      const allSeries = await getAllSeries();
      const allCategories = await getCategories();
      const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
      const catMap = new Map(allCategories.map((c) => [c.id, c]));

      return lessons.map((l) => {
        const s = seriesMap.get(l.series_id) || null;
        const c = s ? catMap.get(s.category_id) || null : null;
        return {
          ...l,
          series: s,
          category: c,
        };
      });
    }
  } catch (err) {
    console.warn('getTopViewedLessons error:', err);
  }
  return getLatestLessons(limit);
}

export async function getKhutabLessons(limit = 8): Promise<LessonWithRelations[]> {
  try {
    const allCategories = await getCategories();
    const khutabCat = allCategories.find(
      (c) => c.slug === 'khutab' || c.name.includes('خطب') || c.name.includes('مواعظ')
    );

    if (!khutabCat) {
      return [];
    }

    const series = await getSeriesByCategory(khutabCat.id);
    if (!series || series.length === 0) return [];

    const seriesIds = series.map((s) => s.id);
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .in('series_id', seriesIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !lessons) return [];

    const seriesMap = new Map(series.map((s) => [s.id, s]));

    return lessons.map((l) => ({
      ...l,
      series: seriesMap.get(l.series_id) || null,
      category: khutabCat,
    }));
  } catch (err) {
    console.warn('getKhutabLessons error:', err);
    return [];
  }
}

export interface CategoryWithPortalData extends Category {
  seriesCount: number;
  lessonCount: number;
  recentLessons: LessonWithRelations[];
}

export async function getCategoriesWithPortalData(recentLimit = 5): Promise<CategoryWithPortalData[]> {
  try {
    const [categories, allSeries, { data: allLessons, error: lError }] = await Promise.all([
      getCategories(),
      getAllSeries(),
      supabase
        .from('lessons')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
    ]);

    if (lError) throw lError;
    const lessonsList = allLessons || [];

    const seriesMap = new Map(allSeries.map((s) => [s.id, s]));

    return categories.map((cat) => {
      const catSeries = allSeries.filter((s) => s.category_id === cat.id);
      const catSeriesIds = new Set(catSeries.map((s) => s.id));
      const catLessons = lessonsList.filter((l) => catSeriesIds.has(l.series_id));

      const populatedRecent: LessonWithRelations[] = catLessons
        .slice(0, recentLimit)
        .map((l) => ({
          ...l,
          series: seriesMap.get(l.series_id) || null,
          category: cat,
        }));

      return {
        ...cat,
        seriesCount: catSeries.length,
        lessonCount: catLessons.length,
        recentLessons: populatedRecent,
      };
    });
  } catch (err) {
    console.error('getCategoriesWithPortalData error:', err);
    throw err;
  }
}

// Finds published lessons by their title, series or category, matching Arabic the way the video and book search
// does (see normalizeArabic). With allowEmpty, an empty query returns every published lesson (the search page then
// filters by category). The matching runs here rather than in the database, which cannot ignore the Arabic marks.
export async function searchLessons(query: string, allowEmpty = false): Promise<LessonWithRelations[]> {
  const q = (query || '').trim();
  if (!q && !allowEmpty) return [];
  try {
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw new Error(translateSupabaseError(error));
    if (!lessons || lessons.length === 0) return [];

    const allSeries = await getAllSeries();
    const allCategories = await getCategories();
    const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
    const catMap = new Map(allCategories.map((c) => [c.id, c]));

    const needle = normalizeArabic(q);
    return lessons
      .map((l) => {
        const s = seriesMap.get(l.series_id) || null;
        const c = s ? catMap.get(s.category_id) || null : null;
        return { ...l, series: s, category: c };
      })
      .filter((l) => !needle || normalizeArabic(`${l.title} ${l.series?.title || ''} ${l.category?.name || ''}`).includes(needle));
  } catch (err) {
    console.error('searchLessons error:', err);
    throw err;
  }
}

export async function getBookmarkedLessons(ids: string[] = []): Promise<LessonWithRelations[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .in('id', ids)
      .eq('status', 'published');

    if (error) throw new Error(translateSupabaseError(error));
    if (!lessons || lessons.length === 0) return [];

    const allSeries = await getAllSeries();
    const allCategories = await getCategories();
    const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
    const catMap = new Map(allCategories.map((c) => [c.id, c]));

    const populated = lessons.map((l) => {
      const s = seriesMap.get(l.series_id) || null;
      const c = s ? catMap.get(s.category_id) || null : null;
      return {
        ...l,
        series: s,
        category: c,
      };
    });

    // Retain order of provided bookmark IDs
    return populated.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  } catch (err) {
    console.error('getBookmarkedLessons error:', err);
    throw err;
  }
}

export async function getAllLessonsAdmin(): Promise<LessonWithRelations[]> {
  try {
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .order('lesson_number', { ascending: true });

    if (error) throw new Error(translateSupabaseError(error));
    if (!lessons) return [];

    const [allSeries, allCategories, extras] = await Promise.all([getAllSeries(), getCategories(), readLessonExtras()]);
    const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
    const catMap = new Map(allCategories.map((c) => [c.id, c]));

    return lessons.map((l) => {
      const s = seriesMap.get(l.series_id) || null;
      const c = s ? catMap.get(s.category_id) || null : null;
      return {
        ...withExtras(l as Lesson, extras),
        series: s,
        category: c,
      };
    });
  } catch (err) {
    console.error('getAllLessonsAdmin error:', err);
    throw err;
  }
}
