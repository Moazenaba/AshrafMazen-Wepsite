// A lesson counts as viewed when the visitor plays its video or audio, or scrolls its transcript: once per lesson per visit.
import { useRef } from 'react';
import { incrementLessonViews } from '../../services/dataService';
import type { Lesson } from '../../types';

// Calls `count` the first time a lesson id is asked for, and not again for that same id
export function createOnceCounter(count: (id: string) => void) {
  let last: string | null = null;
  return (id: string) => {
    if (last === id) return;
    last = id;
    count(id);
  };
}

// Returns the function to call at the moment the visitor really engages with the lesson
export function useViewCounter(lesson: Lesson | null): () => void {
  const once = useRef(createOnceCounter((id) => void incrementLessonViews(id)));
  return () => {
    // A draft shown to an admin as a preview is never counted
    if (lesson && lesson.status === 'published') once.current(lesson.id);
  };
}
