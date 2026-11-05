// Lesson extras: featured lessons and chapters, kept as one JSON record in site_settings.
import { supabase } from '../../lib/supabase';
import type { Lesson, LessonChapter } from '../../types';
import { updateSiteRecord } from './jsonRecord';

interface LessonExtras {
  featured: string[];
  chapters: Record<string, LessonChapter[]>;
}

const LESSON_EXTRAS_KEY = 'lesson_extras';

// What is stored (or nothing / something unreadable) as usable extras
export function parseLessonExtras(raw: string | null): LessonExtras {
  const empty: LessonExtras = { featured: [], chapters: {} };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    return {
      featured: Array.isArray(parsed?.featured) ? parsed.featured : [],
      chapters: parsed?.chapters && typeof parsed.chapters === 'object' ? parsed.chapters : {},
    };
  } catch {
    return empty;
  }
}

export async function readLessonExtras(): Promise<LessonExtras> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', LESSON_EXTRAS_KEY).maybeSingle();
  return error ? parseLessonExtras(null) : parseLessonExtras(data?.value ?? null);
}

// Records a lesson's featured flag and chapters, when the form sent them
export async function saveLessonExtras(lessonId: string, data: Partial<Lesson>): Promise<void> {
  if (data.featured === undefined && data.chapters === undefined) return;
  // Applied to the latest saved copy, so another admin's pinned lessons and chapters are kept
  await updateSiteRecord(LESSON_EXTRAS_KEY, parseLessonExtras, (extras) => {
    if (data.featured !== undefined) {
      extras.featured = extras.featured.filter((id) => id !== lessonId);
      if (data.featured) extras.featured.unshift(lessonId);
    }
    if (data.chapters !== undefined) {
      if (data.chapters && data.chapters.length) extras.chapters[lessonId] = data.chapters;
      else delete extras.chapters[lessonId];
    }
    return extras;
  });
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
