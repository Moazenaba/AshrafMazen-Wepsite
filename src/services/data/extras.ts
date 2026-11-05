// Lesson extras: featured lessons and chapters, kept as one JSON record in site_settings.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { Lesson, LessonChapter } from '../../types';

interface LessonExtras {
  featured: string[];
  chapters: Record<string, LessonChapter[]>;
}

const LESSON_EXTRAS_KEY = 'lesson_extras';

export async function readLessonExtras(): Promise<LessonExtras> {
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
export async function saveLessonExtras(lessonId: string, data: Partial<Lesson>): Promise<void> {
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

export function withExtras<T extends Lesson>(lesson: T, extras: LessonExtras): T {
  return { ...lesson, featured: extras.featured.includes(lesson.id), chapters: extras.chapters[lesson.id] || [] };
}

// The columns the lessons table really has; the extras above are kept out of what is written to it
export function lessonRow(data: Partial<Lesson>): Record<string, unknown> {
  const { featured: _featured, chapters: _chapters, ...row } = data as Record<string, unknown>;
  void _featured;
  void _chapters;
  return row;
}
