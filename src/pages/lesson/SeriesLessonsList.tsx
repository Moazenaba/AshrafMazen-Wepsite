// Every published lesson of the series, with the current one marked and the watched ones ticked.
import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { formatArabicCount, COUNT_FORMS } from '../../utils/helpers';
import { type Lesson } from '../../types';

export const SeriesLessonsList: React.FC<{
  seriesTitle: string;
  lessons: Pick<Lesson, 'id' | 'title' | 'lesson_number'>[];
  currentId: string;
  watchedIds: Set<string>;
}> = ({
  seriesTitle,
  lessons,
  currentId,
  watchedIds,
}) => (
  <section aria-labelledby="series-lessons-heading" data-reveal className="space-y-3 sm:space-y-4">
    <div className="flex items-baseline justify-between gap-4">
      <h2 id="series-lessons-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
        دروس {seriesTitle}
      </h2>
      <span className="text-sm text-stone-600 dark:text-stone-400">
        {formatArabicCount(lessons.length, COUNT_FORMS.lesson)}
      </span>
    </div>
    <ol className="card p-2 sm:p-3">
      {lessons.map((item) => {
        const isCurrent = item.id === currentId;
        return (
          <li key={item.id}>
            <Link
              to={`/lesson/${item.id}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex items-baseline gap-3 sm:gap-4 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-colors ${
                isCurrent
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                  : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span className="w-8 shrink-0 text-stone-500 dark:text-stone-400 tabular-nums">
                {new Intl.NumberFormat('ar-EG').format(item.lesson_number)}
              </span>
              <span className="flex-1 min-w-0">{item.title}</span>
              {watchedIds.has(item.id) && (
                <Check className="w-4 h-4 shrink-0 self-center text-emerald-700 dark:text-emerald-400" aria-label="تمّت متابعته" />
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  </section>
);
