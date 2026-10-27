import { supabase } from '../lib/supabase';
import { translateSupabaseError } from '../utils/supabaseErrors';
import type { Category, Series, Lesson, AdminUser } from '../types';

export type { Category, Series, Lesson, AdminUser };

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
    return data || null;
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
    // Try fetching with featured = true first
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
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
  } catch {
    // column featured does not exist, fall back smoothly
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

export async function getSiteSetting(key: string, defaultVal: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!error && data?.value) {
      return data.value;
    }
  } catch {
    // settings table may not exist
  }
  return defaultVal;
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
  return data;
}

export async function updateLesson(
  id: string,
  lessonData: Partial<Lesson>
): Promise<Lesson> {
  const payload: any = { ...lessonData };
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
  return data;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  return true;
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

  // Unique sanitized filename
  const uniqueId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const filename = `${uniqueId}.${extension}`;

  const { data, error } = await supabase.storage.from('audio').upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Audio upload error:', error);
    throw new Error(translateSupabaseError(error));
  }

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(data.path);
  return urlData.publicUrl;
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
