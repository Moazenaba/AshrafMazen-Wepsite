const RECENT_LESSON_STORAGE_KEY = 'sheikh_mazen_recent_lesson';

// Older than this, "continue where you left off" is no longer useful
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;

export interface RecentLesson {
  id: string;
  title: string;
  seriesTitle?: string;
  openedAt: number;
}

/**
 * Remember the lesson the visitor opened last, in this browser only
 */
export function saveRecentLesson(lesson: Omit<RecentLesson, 'openedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: RecentLesson = { ...lesson, openedAt: Date.now() };
    localStorage.setItem(RECENT_LESSON_STORAGE_KEY, JSON.stringify(entry));
  } catch (err) {
    console.error('Error saving recent lesson to localStorage:', err);
  }
}

/**
 * The last opened lesson, or null when there is none or it is too old
 */
export function getRecentLesson(): RecentLesson | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RECENT_LESSON_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecentLesson;
    if (!parsed?.id || !parsed.title || typeof parsed.openedAt !== 'number') return null;
    if (Date.now() - parsed.openedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch (err) {
    console.error('Error reading recent lesson from localStorage:', err);
    return null;
  }
}
