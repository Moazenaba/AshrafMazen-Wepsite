import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { type LessonWithRelations } from '../../services/dataService';
import { MediaIcons } from '../../components/MediaIcons';
import { formatArabicDate, formatArabicViews } from '../../utils/helpers';
import { arabicNumber } from '../../utils/helpers';

// One lesson in a numbered list
export const LessonRow: React.FC<{ lesson: LessonWithRelations; rank: number }> = ({ lesson, rank }) => (
  <li>
    <Link
      to={`/lesson/${lesson.id}`}
      className="group flex items-start gap-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
    >
      <span className="shrink-0 w-8 h-8 rounded-full bg-mushaf text-gold-soft text-sm font-bold flex items-center justify-center tabular-nums">
        {arabicNumber(rank)}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
          {lesson.title}
        </span>
        <span className="block text-sm text-stone-600 dark:text-stone-400">
          {[lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
        </span>
        <span className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            {formatArabicViews(lesson.views)} مشاهدة
          </span>
          <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
        </span>
      </span>
    </Link>
  </li>
);
