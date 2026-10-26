import { useState, useEffect, useCallback } from 'react';

const BOOKMARKS_STORAGE_KEY = 'sheikh_mazen_bookmarks';

/**
 * Retrieve the list of bookmarked lesson IDs from localStorage
 */
export function getBookmarkedLessonIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading bookmarks from localStorage:', err);
    return [];
  }
}

/**
 * Save array of lesson IDs to localStorage and notify listeners
 */
function saveBookmarkedLessonIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('bookmarks_updated', { detail: { ids } }));
  } catch (err) {
    console.error('Error saving bookmarks to localStorage:', err);
  }
}

/**
 * Check if a specific lesson is currently bookmarked
 */
export function isLessonBookmarked(lessonId: string): boolean {
  if (!lessonId) return false;
  const ids = getBookmarkedLessonIds();
  return ids.includes(lessonId);
}

/**
 * Add a lesson to bookmarks
 */
export function addBookmark(lessonId: string): void {
  if (!lessonId) return;
  const ids = getBookmarkedLessonIds();
  if (!ids.includes(lessonId)) {
    saveBookmarkedLessonIds([lessonId, ...ids]);
  }
}

/**
 * Remove a lesson from bookmarks
 */
export function removeBookmark(lessonId: string): void {
  if (!lessonId) return;
  const ids = getBookmarkedLessonIds();
  const nextIds = ids.filter((id) => id !== lessonId);
  saveBookmarkedLessonIds(nextIds);
}

/**
 * Toggle bookmark status for a lesson.
 * Returns true if now bookmarked, false if removed.
 */
export function toggleBookmark(lessonId: string): boolean {
  if (!lessonId) return false;
  const ids = getBookmarkedLessonIds();
  const exists = ids.includes(lessonId);
  if (exists) {
    saveBookmarkedLessonIds(ids.filter((id) => id !== lessonId));
    return false;
  } else {
    saveBookmarkedLessonIds([lessonId, ...ids]);
    return true;
  }
}

/**
 * Remove all bookmarked lessons
 */
export function clearAllBookmarks(): void {
  saveBookmarkedLessonIds([]);
}

/**
 * Custom React hook to reactively read and toggle bookmarks across any component
 */
export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(getBookmarkedLessonIds);

  const refresh = useCallback(() => {
    setBookmarkedIds(getBookmarkedLessonIds());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener('bookmarks_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('bookmarks_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  const toggle = useCallback((id: string) => {
    return toggleBookmark(id);
  }, []);

  const remove = useCallback((id: string) => {
    removeBookmark(id);
  }, []);

  const clear = useCallback(() => {
    clearAllBookmarks();
  }, []);

  const isBookmarked = useCallback(
    (id: string) => {
      return bookmarkedIds.includes(id);
    },
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    count: bookmarkedIds.length,
    isBookmarked,
    toggleBookmark: toggle,
    removeBookmark: remove,
    clearAllBookmarks: clear,
    refresh,
  };
}
