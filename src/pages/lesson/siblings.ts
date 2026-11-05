// The previous and next published lessons of a series.
import type { Lesson } from '../../types';

export function siblingsOf<T extends Pick<Lesson, 'id'>>(lessons: T[], currentId: string | undefined) {
  const index = lessons.findIndex((l) => l.id === currentId);
  return {
    prevLesson: index > 0 ? lessons[index - 1] : null,
    nextLesson: index !== -1 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}
