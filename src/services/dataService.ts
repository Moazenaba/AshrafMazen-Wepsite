import { supabase } from '../lib/supabase';
import { translateSupabaseError } from '../utils/supabaseErrors';
import { deleteFromR2, isR2Url, r2DownloadUrl, uploadToR2 } from './r2';
import type {
  Category,
  Series,
  Lesson,
  LessonChapter,
  Book,
  AdminUser,
  SocialLink,
  SocialPlatform,
  SiteSettings,
} from '../types';

export type {
  Category,
  Series,
  Lesson,
  Book,
  AdminUser,
  SocialLink,
  SocialPlatform,
  SiteSettings,
};

export interface LessonWithRelations extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

// Sluggify string with Arabic support and English fallback
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '-')
    .replace(/[^\w\u0621-\u064A0-9\-]/g, '');
}

/**
 * ============================================================================
 * LESSON EXTRAS: the featured lessons and each lesson's chapters
 * ============================================================================
 * Kept as one JSON record ("lesson_extras") in site_settings rather than as columns of the lessons
 * table, so they work without changing the database. Saving a lesson writes its extras here.
 */

interface LessonExtras {
  featured: string[];
  chapters: Record<string, LessonChapter[]>;
}

const LESSON_EXTRAS_KEY = 'lesson_extras';

async function readLessonExtras(): Promise<LessonExtras> {
  const empty: LessonExtras = { featured: [], chapters: {} };
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', LESSON_EXTRAS_KEY).maybeSingle();
  if (error || !data?.value) return empty;
  try {
    const parsed = JSON.parse(data.value);
    return {
      featured: Array.isArray(parsed?.featured) ? parsed.featured : [],
      chapters: parsed?.chapters && typeof parsed.chapters === 'object' ? parsed.chapters : {},
    };
  } catch {
    return empty;
  }
}

async function writeLessonExtras(extras: LessonExtras): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert([{ key: LESSON_EXTRAS_KEY, value: JSON.stringify(extras) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
}

// Records a lesson's featured flag and chapters, when the form sent them
async function saveLessonExtras(lessonId: string, data: Partial<Lesson>): Promise<void> {
  if (data.featured === undefined && data.chapters === undefined) return;
  const extras = await readLessonExtras();
  if (data.featured !== undefined) {
    extras.featured = extras.featured.filter((id) => id !== lessonId);
    if (data.featured) extras.featured.unshift(lessonId);
  }
  if (data.chapters !== undefined) {
    if (data.chapters && data.chapters.length) extras.chapters[lessonId] = data.chapters;
    else delete extras.chapters[lessonId];
  }
  await writeLessonExtras(extras);
}

function withExtras<T extends Lesson>(lesson: T, extras: LessonExtras): T {
  return { ...lesson, featured: extras.featured.includes(lesson.id), chapters: extras.chapters[lesson.id] || [] };
}

// The columns the lessons table really has; the extras above are kept out of what is written to it
function lessonRow(data: Partial<Lesson>): Record<string, unknown> {
  const { featured: _featured, chapters: _chapters, ...row } = data as Record<string, unknown>;
  void _featured;
  void _chapters;
  return row;
}

/**
 * ============================================================================
 * PUBLIC DATA-ACCESS API (Supabase Implementation)
 * ============================================================================
 */

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(translateSupabaseError(error));
    }
    return data || [];
  } catch (err: any) {
    console.error('getCategories error:', err);
    throw err;
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getCategory error:', err);
    throw err;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getCategoryBySlug error:', err);
    throw err;
  }
}

export async function getAllSeries(): Promise<Series[]> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(translateSupabaseError(error));
    return data || [];
  } catch (err) {
    console.error('getAllSeries error:', err);
    throw err;
  }
}

export async function getSeriesByCategory(categoryId: string): Promise<Series[]> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(translateSupabaseError(error));
    return data || [];
  } catch (err) {
    console.error('getSeriesByCategory error:', err);
    throw err;
  }
}

export async function getSeries(seriesId: string): Promise<Series | null> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id', seriesId)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getSeries error:', err);
    throw err;
  }
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getSeriesBySlug error:', err);
    throw err;
  }
}

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

export async function searchLessons(query: string): Promise<LessonWithRelations[]> {
  if (!query || !query.trim()) return [];
  try {
    const q = query.trim();
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .ilike('title', `%${q}%`)
      .order('published_at', { ascending: false });

    if (error) throw new Error(translateSupabaseError(error));
    if (!lessons || lessons.length === 0) return [];

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

/**
 * ============================================================================
 * ADMIN CRUD FUNCTIONS (Supabase Direct)
 * ============================================================================
 */

// Categories CRUD
export async function createCategory(categoryData: Partial<Category>): Promise<Category> {
  const name = (categoryData.name || '').trim();
  if (!name) throw new Error('يرجى كتابة اسم القسم.');

  let finalSlug = slugify(categoryData.slug ? categoryData.slug : name);
  if (!finalSlug) finalSlug = `cat-${Date.now().toString(36)}`;

  const payload = {
    name,
    slug: finalSlug,
    description: (categoryData.description || '').trim(),
    sort_order: Number(categoryData.sort_order) || 1,
    color: categoryData.color || 'emerald',
    icon: categoryData.icon || 'BookOpen',
  };

  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function updateCategory(
  id: string,
  categoryData: Partial<Category>
): Promise<Category> {
  const payload: any = { ...categoryData };
  if (categoryData.slug) {
    payload.slug = slugify(categoryData.slug);
  }

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Check if category has series before deletion
  const { data: existingSeries, error: countErr } = await supabase
    .from('series')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (countErr) {
    console.error('Error checking series for category:', countErr);
  }

  if (existingSeries && existingSeries.length > 0) {
    throw new Error('لا يمكن حذف هذا القسم لأنه يحتوي على سلاسل علمية مرتبطة به. يرجى حذف أو نقل السلاسل أولاً.');
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  return true;
}

// Series CRUD
export async function createSeries(seriesData: Partial<Series>): Promise<Series> {
  const title = (seriesData.title || '').trim();
  if (!title) throw new Error('يرجى إدخال عنوان السلسلة العلمية.');
  if (!seriesData.category_id) throw new Error('يرجى اختيار القسم التابع له السلسلة.');

  let finalSlug = slugify(seriesData.slug ? seriesData.slug : title);
  if (!finalSlug) finalSlug = `series-${Date.now().toString(36)}`;

  const payload = {
    category_id: seriesData.category_id,
    title,
    slug: finalSlug,
    description: (seriesData.description || '').trim(),
    sort_order: Number(seriesData.sort_order) || 1,
  };

  const { data, error } = await supabase
    .from('series')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function updateSeries(
  id: string,
  seriesData: Partial<Series>
): Promise<Series> {
  const payload: any = { ...seriesData };
  if (seriesData.slug) {
    payload.slug = slugify(seriesData.slug);
  }

  const { data, error } = await supabase
    .from('series')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function deleteSeries(id: string): Promise<boolean> {
  const { error } = await supabase.from('series').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  return true;
}

// Lessons CRUD
export async function createLesson(lessonData: Partial<Lesson>): Promise<Lesson> {
  const title = (lessonData.title || '').trim();
  if (!title) throw new Error('يرجى إدخال عنوان الدرس.');
  if (!lessonData.series_id) throw new Error('يرجى اختيار السلسلة العلمية.');

  const isPublished = lessonData.status === 'published';
  let published_at = lessonData.published_at;
  if (isPublished && !published_at) {
    published_at = new Date().toISOString();
  }

  const payload = {
    series_id: lessonData.series_id,
    title,
    lesson_number: Number(lessonData.lesson_number) || 1,
    youtube_url: (lessonData.youtube_url || '').trim(),
    audio_url: (lessonData.audio_url || '').trim(),
    transcript: (lessonData.transcript || '').trim(),
    status: lessonData.status || 'published',
    published_at,
  };

  const { data, error } = await supabase
    .from('lessons')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  await saveLessonExtras(data.id, { featured: Boolean(lessonData.featured), chapters: lessonData.chapters || [] });
  return data;
}

export async function updateLesson(
  id: string,
  lessonData: Partial<Lesson>
): Promise<Lesson> {
  const payload: any = lessonRow(lessonData);
  if (payload.status === 'published' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('lessons')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  await saveLessonExtras(id, lessonData);
  return data;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  try {
    await saveLessonExtras(id, { featured: false, chapters: [] });
  } catch (err) {
    console.error('Lesson extras were not cleared:', err);
  }
  return true;
}

/**
 * ============================================================================
 * AUDIO LIBRARY: every published lesson that has a recording
 * ============================================================================
 */

export async function getAudioLessons(): Promise<LessonWithRelations[]> {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'published')
    .neq('audio_url', '')
    .not('audio_url', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(translateSupabaseError(error));
  if (!lessons || lessons.length === 0) return [];

  const [allSeries, allCategories] = await Promise.all([getAllSeries(), getCategories()]);
  const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
  const catMap = new Map(allCategories.map((c) => [c.id, c]));
  return lessons.map((l) => {
    const s = seriesMap.get(l.series_id) || null;
    return { ...l, series: s, category: s ? catMap.get(s.category_id) || null : null };
  });
}

/**
 * ============================================================================
 * THE LIBRARY: books and written works as PDF files
 * ============================================================================
 * The list is kept as one JSON record ("library_books") in the site_settings table, which the admin already
 * writes to and visitors already read, so the library needs no new table or database setup. The PDF files
 * and covers go to the site's existing storage buckets.
 */

export interface BookWithCategory extends Book {
  category?: Category | null;
}

const LIBRARY_KEY = 'library_books';

async function readLibrary(): Promise<Book[]> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', LIBRARY_KEY).maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  if (!data?.value) return [];
  try {
    const list = JSON.parse(data.value);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeLibrary(books: Book[]): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert([{ key: LIBRARY_KEY, value: JSON.stringify(books) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
}

const byShelfOrder = (a: Book, b: Book) =>
  (a.sort_order || 0) - (b.sort_order || 0) || (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at);

async function attachBookCategories(books: Book[]): Promise<BookWithCategory[]> {
  if (books.length === 0) return [];
  const catMap = new Map((await getCategories()).map((c) => [c.id, c]));
  return books.map((b) => ({ ...b, category: b.category_id ? catMap.get(b.category_id) || null : null }));
}

export async function getPublishedBooks(): Promise<BookWithCategory[]> {
  const books = (await readLibrary()).filter((b) => b.status === 'published').sort(byShelfOrder);
  return attachBookCategories(books);
}

export async function getBook(id: string, includeDrafts = false): Promise<BookWithCategory | null> {
  const book = (await readLibrary()).find((b) => b.id === id && (includeDrafts || b.status === 'published'));
  return book ? (await attachBookCategories([book]))[0] : null;
}

export async function getAllBooksAdmin(): Promise<BookWithCategory[]> {
  return attachBookCategories((await readLibrary()).sort(byShelfOrder));
}

function cleanBook(bookData: Partial<Book>, base: Book): Book {
  const status = bookData.status ?? base.status;
  return {
    ...base,
    title: (bookData.title ?? base.title).trim(),
    author: (bookData.author ?? base.author ?? '').trim(),
    description: (bookData.description ?? base.description ?? '').trim(),
    category_id: bookData.category_id !== undefined ? bookData.category_id || null : base.category_id,
    file_url: (bookData.file_url ?? base.file_url).trim(),
    cover_url: bookData.cover_url !== undefined ? (bookData.cover_url ? bookData.cover_url.trim() : null) : base.cover_url,
    pages: bookData.pages !== undefined ? (bookData.pages ? Number(bookData.pages) : null) : base.pages,
    sort_order: bookData.sort_order !== undefined ? Number(bookData.sort_order) || 0 : base.sort_order,
    status,
    published_at: status === 'published' ? base.published_at || new Date().toISOString() : base.published_at,
  };
}

export async function createBook(bookData: Partial<Book>): Promise<Book> {
  if (!(bookData.title || '').trim()) throw new Error('يرجى إدخال عنوان الكتاب.');
  if (!(bookData.file_url || '').trim()) throw new Error('يرجى رفع ملف الكتاب (PDF) أو إدخال رابطه.');
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const base: Book = {
    id,
    title: '',
    author: '',
    description: '',
    category_id: null,
    file_url: '',
    cover_url: null,
    pages: null,
    sort_order: 0,
    status: 'published',
    published_at: null,
    created_at: new Date().toISOString(),
  };
  const book = cleanBook(bookData, base);
  const books = await readLibrary();
  await writeLibrary([...books, book]);
  return book;
}

export async function updateBook(id: string, bookData: Partial<Book>): Promise<Book> {
  const books = await readLibrary();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('هذا الكتاب لم يعد موجوداً.');
  const book = cleanBook(bookData, books[index]);
  if (!book.title) throw new Error('يرجى إدخال عنوان الكتاب.');
  if (!book.file_url) throw new Error('يرجى رفع ملف الكتاب (PDF) أو إدخال رابطه.');
  books[index] = book;
  await writeLibrary(books);
  return book;
}

// Deletes the book and the files it uploaded; a file that cannot be removed does not block the delete
export async function deleteBook(book: Pick<Book, 'id' | 'file_url' | 'cover_url'>): Promise<boolean> {
  const books = await readLibrary();
  await writeLibrary(books.filter((b) => b.id !== book.id));
  for (const url of [book.file_url, book.cover_url]) {
    if (isR2Url(url)) await deleteFromR2(url as string);
  }
  return true;
}

const BOOK_FILE_RULES = {
  pdf: { extensions: ['pdf'], maxMb: 100, message: 'يرجى اختيار ملف بصيغة PDF.' },
  cover: { extensions: ['jpg', 'jpeg', 'png', 'webp'], maxMb: 5, message: 'يرجى اختيار صورة غلاف بصيغة jpg أو png أو webp.' },
} as const;

export async function uploadBookFile(file: File, kind: 'pdf' | 'cover'): Promise<string> {
  const rules = BOOK_FILE_RULES[kind];
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  if (!(rules.extensions as readonly string[]).includes(extension)) throw new Error(rules.message);
  if (file.size > rules.maxMb * 1024 * 1024) throw new Error(`حجم الملف أكبر من ${rules.maxMb} ميجابايت.`);

  return uploadToR2(file, kind);
}

// A link that downloads the file with the book's title as its name; a file hosted elsewhere is linked as it is
export function bookDownloadUrl(book: Pick<Book, 'file_url' | 'title'>): string {
  if (!isR2Url(book.file_url)) return book.file_url;
  const name = `${book.title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'book'}.pdf`;
  return r2DownloadUrl(book.file_url, name);
}

/**
 * ============================================================================
 * THE CHANNEL'S VIDEOS: what the admin hid or renamed
 * ============================================================================
 * The playlists and videos come from the YouTube channel (the bundled library plus the RSS merge in
 * api/youtube-library.ts). The admin cannot edit YouTube, but can hide a playlist or a video from the site and
 * give a video or playlist a different title here. Kept as one JSON record ("youtube_overrides") in site_settings.
 */

export interface YoutubeOverrides {
  hiddenPlaylists: string[];
  hiddenVideos: string[];
  videoTitles: Record<string, string>;
  playlistTitles: Record<string, string>;
  // Playlists added by the admin; api/youtube-library.ts reads their videos from YouTube's feed
  extraPlaylists: { id: string; title: string }[];
}

const YOUTUBE_OVERRIDES_KEY = 'youtube_overrides';

export async function getYoutubeOverrides(): Promise<YoutubeOverrides> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', YOUTUBE_OVERRIDES_KEY).maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  try {
    const parsed = JSON.parse(data?.value || '{}');
    return {
      hiddenPlaylists: Array.isArray(parsed.hiddenPlaylists) ? parsed.hiddenPlaylists : [],
      hiddenVideos: Array.isArray(parsed.hiddenVideos) ? parsed.hiddenVideos : [],
      videoTitles: parsed.videoTitles && typeof parsed.videoTitles === 'object' ? parsed.videoTitles : {},
      playlistTitles: parsed.playlistTitles && typeof parsed.playlistTitles === 'object' ? parsed.playlistTitles : {},
      extraPlaylists: Array.isArray(parsed.extraPlaylists) ? parsed.extraPlaylists : [],
    };
  } catch {
    return { hiddenPlaylists: [], hiddenVideos: [], videoTitles: {}, playlistTitles: {}, extraPlaylists: [] };
  }
}

export async function saveYoutubeOverrides(overrides: YoutubeOverrides): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert([{ key: YOUTUBE_OVERRIDES_KEY, value: JSON.stringify(overrides) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
}

/**
 * ============================================================================
 * VISITOR CONTRIBUTIONS: suggestions, corrections and removal requests
 * ============================================================================
 * Visitors have no accounts. They send a request (api/submit), it waits as "pending" in the submissions table,
 * and nothing on the site changes until an admin approves it here.
 */

export type SubmissionKind = 'book' | 'audio' | 'video' | 'correction' | 'removal';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  kind: SubmissionKind;
  title: string;
  url: string;
  author: string;
  details: string;
  target: string;
  contact: string;
  status: SubmissionStatus;
  admin_note: string;
  created_at: string;
  reviewed_at: string | null;
}

export async function getSubmissions(status?: SubmissionStatus): Promise<Submission[]> {
  let query = supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(300);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(translateSupabaseError(error));
  return data || [];
}

export async function getPendingSubmissionsCount(): Promise<number> {
  const { count, error } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  if (error) return 0;
  return count || 0;
}

export async function reviewSubmission(id: string, status: SubmissionStatus, adminNote = ''): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ status, admin_note: adminNote.trim().slice(0, 1000), reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
}

export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
}

/**
 * ============================================================================
 * AUDIO UPLOAD (Supabase "audio" Storage Bucket)
 * ============================================================================
 */

export async function uploadAudioFile(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف صوتي.');

  // Validate file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ['mp3', 'm4a', 'wav', 'ogg'];
  if (!allowedExtensions.includes(extension)) {
    throw new Error('صيغة الملف غير مدعومة. يرجى اختيار ملف صوتي بصيغة (mp3, m4a, wav, ogg).');
  }

  return uploadToR2(file, 'audio');
}

/**
 * ============================================================================
 * ADMIN AUTHENTICATION (Supabase Auth + "admins" table RBAC)
 * ============================================================================
 */

/**
 * Login with Supabase Auth and verify existence in admins table
 */
export async function login(email: string, password: string): Promise<AdminUser> {
  const cleanEmail = email.trim().toLowerCase();

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (authErr || !authData.user) {
    console.error('Login auth error:', authErr);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  // Verify that the user exists in the "admins" table
  const { data: adminRecord, error: adminErr } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (adminErr || !adminRecord) {
    console.error('User not in admins table:', adminErr || 'Not found');
    await supabase.auth.signOut();
    throw new Error('ليس لديك صلاحية الدخول');
  }

  const adminUser: AdminUser = {
    email: authData.user.email || cleanEmail,
    name: authData.user.user_metadata?.name || 'مدير النظام',
    role: 'admin',
  };

  return adminUser;
}

/**
 * Check if the current logged-in user is an admin
 */
export async function checkCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRecord) {
      await supabase.auth.signOut();
      return null;
    }

    return {
      email: user.email || '',
      name: user.user_metadata?.name || 'مدير الموقع',
      role: 'admin',
    };
  } catch (err) {
    console.error('checkCurrentAdmin error:', err);
    return null;
  }
}

export async function logout(): Promise<boolean> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }
  return true;
}

/**
 * Request password recovery email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const redirectTo = `${window.location.origin}/admin/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo,
  });

  if (error) {
    console.error('resetPasswordForEmail error:', error);
  }
  // Neutral message always displayed as per requirement
}

/**
 * Update the user password (used in reset-password flow or inside dashboard)
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(translateSupabaseError(error));
  }
}

/**
 * ============================================================================
 * SITE SETTINGS & BRANDING (site_settings table & "branding" bucket)
 * ============================================================================
 */

let cachedSiteSettings: SiteSettings | null = null;
let cachedActiveSocialLinks: SocialLink[] | null = null;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  banner_name: 'أبو عبد الرحمن أشرف بن طه بن مازن',
  banner_logo_url: '',
  about_sheikh:
    'الشيخ أشرف مازن، من علماء وأساتذة العلوم الشرعية المعاصرين. يُعنى بنشر العلم الشرعي المؤصل، وشرح المتون العلمية في الفقه، والعقيدة، والحديث، والأصول وعلوم التزكية وفق منهج أهل السنة والجماعة.',
};

export async function getSiteSettings(forceRefresh = false): Promise<SiteSettings> {
  if (cachedSiteSettings && !forceRefresh) {
    return cachedSiteSettings;
  }
  try {
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (!error && data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((row) => {
        if (row.key) settingsMap[row.key] = row.value || '';
      });

      cachedSiteSettings = {
        banner_name: settingsMap.banner_name || DEFAULT_SITE_SETTINGS.banner_name,
        banner_logo_url: settingsMap.banner_logo_url || '',
        about_sheikh: settingsMap.about_sheikh || DEFAULT_SITE_SETTINGS.about_sheikh,
      };
      return cachedSiteSettings;
    }
  } catch (err) {
    console.warn('Failed to load site_settings, using fallback:', err);
  }

  cachedSiteSettings = { ...DEFAULT_SITE_SETTINGS };
  return cachedSiteSettings;
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const entries = Object.entries(settings).filter(([_, val]) => val !== undefined);
  if (entries.length === 0) return;

  const rows = entries.map(([key, value]) => ({
    key,
    value: value || '',
  }));

  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    throw new Error(translateSupabaseError(error));
  }

  // Refresh cache
  cachedSiteSettings = null;
  await getSiteSettings(true);
}

export async function uploadBrandingLogo(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف شعار.');

  // Validate format
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowed = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
  if (!allowed.includes(extension)) {
    throw new Error('صيغة الملف غير مدعومة. يرجى اختيار ملف صورة بصيغة (PNG, JPG, SVG, WebP).');
  }

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 2 ميجابايت.');
  }

  return uploadToR2(file, 'logo');
}

/**
 * ============================================================================
 * SOCIAL LINKS (social_links table)
 * ============================================================================
 */

export async function getActiveSocialLinks(forceRefresh = false): Promise<SocialLink[]> {
  if (cachedActiveSocialLinks && !forceRefresh) {
    return cachedActiveSocialLinks;
  }

  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      cachedActiveSocialLinks = data;
      return data;
    }
  } catch (err) {
    console.warn('getActiveSocialLinks fallback:', err);
  }

  cachedActiveSocialLinks = [];
  return [];
}

export async function getAllSocialLinksAdmin(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(translateSupabaseError(error));
  }

  return data || [];
}

export async function createSocialLink(link: Omit<SocialLink, 'id'>): Promise<SocialLink> {
  const platform = (link.platform || '').trim();
  const url = (link.url || '').trim();
  if (!platform) throw new Error('يرجى اختيار المنصة.');
  if (!url) throw new Error('يرجى إدخال الرابط.');

  const payload = {
    platform,
    url,
    sort_order: Number(link.sort_order) || 0,
    is_active: link.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('social_links')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  cachedActiveSocialLinks = null;
  return data;
}

export async function updateSocialLink(
  id: string,
  updates: Partial<SocialLink>
): Promise<SocialLink> {
  const payload: any = { ...updates };
  if (payload.platform) payload.platform = payload.platform.trim();
  if (payload.url) payload.url = payload.url.trim();

  const { data, error } = await supabase
    .from('social_links')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  cachedActiveSocialLinks = null;
  return data;
}

export async function deleteSocialLink(id: string): Promise<boolean> {
  const { error } = await supabase.from('social_links').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  cachedActiveSocialLinks = null;
  return true;
}

