// Lesson extras: featured lessons, chapters and the lesson's own picture, kept as one JSON record in site_settings
// (no column in the lessons table, so no database change is needed for them).
import { supabase } from '../../lib/supabase';
import type { Lesson, LessonChapter } from '../../types';
import { updateSiteRecord } from './jsonRecord';
import { deleteIfUnused } from './fileUsage';

interface LessonExtras {
  featured: string[];
  chapters: Record<string, LessonChapter[]>;
  images: Record<string, string>;
}

const LESSON_EXTRAS_KEY = 'lesson_extras';

// What is stored (or nothing / something unreadable) as usable extras
export function parseLessonExtras(raw: string | null): LessonExtras {
  const empty: LessonExtras = { featured: [], chapters: {}, images: {} };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    return {
      featured: Array.isArray(parsed?.featured) ? parsed.featured : [],
      chapters: parsed?.chapters && typeof parsed.chapters === 'object' ? parsed.chapters : {},
      images:
        parsed?.images && typeof parsed.images === 'object'
          ? (Object.fromEntries(Object.entries(parsed.images).filter(([, url]) => typeof url === 'string' && url.trim())) as Record<string, string>)
          : {},
    };
  } catch {
    return empty;
  }
}

export async function readLessonExtras(): Promise<LessonExtras> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', LESSON_EXTRAS_KEY).maybeSingle();
  // Visitors read this too, so a broken value only shows no pictures; saving is what refuses it (see updateSiteRecord)
  return error ? parseLessonExtras(null) : parseLessonExtras(data?.value ?? null);
}

// Records a lesson's featured flag, chapters and picture, when the form sent them
export async function saveLessonExtras(lessonId: string, data: Partial<Lesson>): Promise<void> {
  if (data.featured === undefined && data.chapters === undefined && data.image === undefined) return;
  // Applied to the latest saved copy, so another admin's pinned lessons and chapters are kept
  let previousPicture = '';
  await updateSiteRecord(LESSON_EXTRAS_KEY, parseLessonExtras, (extras) => {
    if (data.featured !== undefined) {
      extras.featured = extras.featured.filter((id) => id !== lessonId);
      if (data.featured) extras.featured.unshift(lessonId);
    }
    if (data.chapters !== undefined) {
      if (data.chapters && data.chapters.length) extras.chapters[lessonId] = data.chapters;
      else delete extras.chapters[lessonId];
    }
    if (data.image !== undefined) {
      const url = String(data.image || '').trim();
      previousPicture = extras.images[lessonId] || '';
      if (url) extras.images[lessonId] = url;
      else delete extras.images[lessonId];
    }
    return extras;
  }, { shape: 'object' });
  // The picture was replaced or removed: its file goes unless something else still uses it
  if (previousPicture && previousPicture !== String(data.image || '').trim()) await deleteIfUnused(previousPicture);
}

export function withExtras<T extends Lesson>(lesson: T, extras: LessonExtras): T {
  return { ...lesson, featured: extras.featured.includes(lesson.id), chapters: extras.chapters[lesson.id] || [], image: extras.images[lesson.id] || undefined };
}

// Only the pictures, for lists of lessons
export function withImages<T extends Lesson>(lessons: T[], extras: LessonExtras): T[] {
  return lessons.map((l) => (extras.images[l.id] ? { ...l, image: extras.images[l.id] } : l));
}

// The columns the lessons table really has; the extras above are kept out of what is written to it
export function lessonRow(data: Partial<Lesson>): Record<string, unknown> {
  const { featured: _featured, chapters: _chapters, image: _image, ...row } = data as Record<string, unknown>;
  void _featured;
  void _chapters;
  void _image;
  return row;
}

// The extras read once and shared for a few seconds: one page asks for several lists at once (latest, featured,
// most viewed, sermons, categories), and each would otherwise read the same record again
const SHARE_MS = 15_000;
let shared: { at: number; value: Promise<LessonExtras> } | null = null;
function sharedLessonExtras(): Promise<LessonExtras> {
  if (!shared || Date.now() - shared.at > SHARE_MS) shared = { at: Date.now(), value: readLessonExtras() };
  return shared.value;
}

// Each lesson's own picture, for the lists read straight from the database (what an admin sees; visitors get the same
// pictures through the site bundle, siteBundleRules.buildHomeLists)
export async function withLessonPictures<T extends Lesson>(lessons: T[]): Promise<T[]> {
  return withImages(lessons, await sharedLessonExtras());
}
