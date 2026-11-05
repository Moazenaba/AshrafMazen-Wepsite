// The lesson's chapters: jump straight to a part of the lesson.
import React from 'react';
import { Clock } from 'lucide-react';
import { formatAudioTime } from '../../utils/helpers';
import { type LessonChapter } from '../../types';

export const ChapterList: React.FC<{ chapters: LessonChapter[]; currentChapter: number; onSeek: (seconds: number) => void }> = ({
  chapters,
  currentChapter,
  onSeek,
}) => (
  <section aria-labelledby="chapters-heading" className="card p-4 sm:p-5 space-y-3">
    <h2 id="chapters-heading" className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
      <Clock className="w-5 h-5 text-emerald-800 dark:text-amber-400" aria-hidden="true" />
      <span>فصول الدرس</span>
    </h2>
    <ol className="space-y-1">
      {chapters.map((chapter, i) => (
        <li key={`${chapter.seconds}-${i}`}>
          <button
            type="button"
            onClick={() => onSeek(chapter.seconds)}
            aria-current={i === currentChapter ? 'true' : undefined}
            className={`w-full flex items-baseline gap-4 px-3 py-2.5 rounded-xl text-start transition-colors ${
              i === currentChapter
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <span className="shrink-0 w-16 text-sm text-stone-600 dark:text-stone-400 tabular-nums">
              {formatAudioTime(chapter.seconds)}
            </span>
            <span>{chapter.title}</span>
          </button>
        </li>
      ))}
    </ol>
  </section>
);
