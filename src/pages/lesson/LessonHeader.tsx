// The lesson page's header: breadcrumb, title, details, and the save and share buttons.
import React from 'react';
import type { Category } from '../../types';
import { Link } from 'react-router-dom';
import { ChevronLeft, Share2, Check, Bookmark } from 'lucide-react';
import { getArabicLessonOrdinal, formatArabicDate, formatArabicCount, COUNT_FORMS } from '../../utils/helpers';
import { type Lesson, type Series } from '../../types';
import { actionButton } from './styles';

export const LessonHeader: React.FC<{
  lesson: Lesson;
  series: Series;
  category: Category | null;
  watched: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
}> = ({ lesson, series, category, watched, bookmarked, onToggleBookmark, onShare }) => {
  const metaLine = [
    getArabicLessonOrdinal(lesson.lesson_number),
    formatArabicDate(lesson.published_at),
    typeof lesson.views === 'number' && lesson.views > 0 ? formatArabicCount(lesson.views, COUNT_FORMS.view) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <header data-reveal className="space-y-3 sm:space-y-4">
      <nav aria-label="مسار التصفح" className="flex items-center flex-wrap gap-1 text-sm text-stone-600 dark:text-stone-400">
        <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
          الرئيسية
        </Link>
        {category && (
          <>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <Link to={`/category/${category.slug}`} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
              {category.name}
            </Link>
          </>
        )}
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <Link to={`/series/${series.slug}`} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
          {series.title}
        </Link>
      </nav>

      <h1 className="font-amiri text-3xl sm:text-5xl font-bold leading-snug text-emerald-950 dark:text-stone-100 text-balance">
        {lesson.title}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-stone-600 dark:text-stone-400">{metaLine}</p>
          {watched && (
            <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>تمّت متابعته</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-pressed={bookmarked}
            className={actionButton}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current text-amber-600 dark:text-amber-400' : ''}`} />
            <span>{bookmarked ? 'محفوظ' : 'حفظ'}</span>
          </button>
          <button type="button" onClick={onShare} className={actionButton}>
            <Share2 className="w-4 h-4" />
            <span>مشاركة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
