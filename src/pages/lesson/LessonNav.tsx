// Previous and next lesson of the series.
import React from 'react';
import { Link } from 'react-router-dom';
import { type Lesson } from '../../types';

export const LessonNav: React.FC<{ prev: Pick<Lesson, 'id' | 'title'> | null; next: Pick<Lesson, 'id' | 'title'> | null }> = ({ prev, next }) => {
  if (!prev && !next) return null;
  return (
    <nav aria-label="التنقل بين دروس السلسلة" data-reveal className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        {prev ? (
          <Link
            to={`/lesson/${prev.id}`}
            className="card block p-4 sm:p-5"
          >
            <span className="block text-sm text-stone-600 dark:text-stone-400">السابق</span>
            <span className="block mt-1 font-semibold text-stone-900 dark:text-stone-100">{prev.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link
            to={`/lesson/${next.id}`}
            className="card block p-4 sm:p-5 sm:text-left"
          >
            <span className="block text-sm text-stone-600 dark:text-stone-400">التالي</span>
            <span className="block mt-1 font-semibold text-stone-900 dark:text-stone-100">{next.title}</span>
          </Link>
        )}
      </nav>
  );
};
