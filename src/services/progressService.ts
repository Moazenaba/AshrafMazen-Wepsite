// Per-browser playback memory: where the visitor stopped in each lesson, and which lessons they finished.
// Stored only in this browser, so it is a convenience and never the source of truth for anything.

const PROGRESS_STORAGE_KEY = 'sheikh_mazen_progress';
const PROGRESS_EVENT = 'progress_updated';

// Positions closer to the start than this are not worth resuming
const MIN_RESUME_SECONDS = 5;
// Past this share of the lesson, it counts as watched or heard
const WATCHED_RATIO = 0.9;

export interface LessonProgress {
  seconds: number;
  duration: number;
  watched: boolean;
  updatedAt: number;
}

export type ProgressMap = Record<string, LessonProgress>;

export function readProgressMap(): ProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgressMap(map: ProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Storage full or blocked: playback still works, it just is not remembered
  }
}

export function getLessonProgress(lessonId: string): LessonProgress | null {
  return readProgressMap()[lessonId] ?? null;
}

/**
 * The second to resume from, or 0 when there is nothing worth resuming (or it was finished).
 */
export function getResumeSeconds(lessonId: string): number {
  const entry = getLessonProgress(lessonId);
  if (!entry || entry.watched || entry.seconds < MIN_RESUME_SECONDS) return 0;
  return entry.seconds;
}

export function saveLessonPosition(lessonId: string, seconds: number, duration: number): void {
  if (!lessonId || !isFinite(seconds) || seconds < 0) return;
  const map = readProgressMap();
  const previous = map[lessonId];
  const finished = duration > 0 && seconds / duration >= WATCHED_RATIO;
  map[lessonId] = {
    seconds,
    duration: duration > 0 ? duration : previous?.duration ?? 0,
    watched: Boolean(previous?.watched || finished),
    updatedAt: Date.now(),
  };
  writeProgressMap(map);
}

export function markLessonWatched(lessonId: string): void {
  if (!lessonId) return;
  const map = readProgressMap();
  const previous = map[lessonId];
  map[lessonId] = {
    seconds: 0,
    duration: previous?.duration ?? 0,
    watched: true,
    updatedAt: Date.now(),
  };
  writeProgressMap(map);
}

export function isLessonWatched(lessonId: string): boolean {
  return Boolean(getLessonProgress(lessonId)?.watched);
}

