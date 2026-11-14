// Reading one lesson, or the lessons of one series, and counting a view.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { Lesson } from '../../types';
import { rowsOrThrow } from './db';
import { readLessonExtras, withExtras, withImages } from './extras';

export async function getLessonsBySeries(seriesId: string, includeDrafts = false): Promise<Lesson[]> {
  let query = supabase.from('lessons').select('*').eq('series_id', seriesId).order('lesson_number', { ascending: true });
  if (!includeDrafts) query = query.eq('status', 'published');
  const [lessons, extras] = await Promise.all([rowsOrThrow<Lesson>(await query), readLessonExtras()]);
  // Each lesson's own picture, when the admin chose one
  return withImages(lessons, extras);
}

// A draft is returned only when asked for (and the database gives it only to an admin)
export async function getLesson(lessonId: string, includeDrafts = false): Promise<Lesson | null> {
  let query = supabase.from('lessons').select('*').eq('id', lessonId);
  if (!includeDrafts) query = query.eq('status', 'published');
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  if (!data) return null;
  return withExtras(data as Lesson, await readLessonExtras());
}

// Counts one view per browser session; never throws (a counter must not break a page)
export async function incrementLessonViews(lessonId: string): Promise<void> {
  if (!lessonId) return;
  try {
    const sessionKey = `viewed_lesson_${lessonId}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    }
    const { error } = await supabase.rpc('increment_lesson_views', { lesson_id: lessonId });
    if (error) console.warn('increment_lesson_views RPC notice:', error.message);
  } catch (err) {
    console.warn('incrementLessonViews error:', err);
  }
}
