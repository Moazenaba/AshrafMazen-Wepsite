import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { type LessonWithRelations } from '../../services/dataService';
import { LessonThumb } from '../../components/LessonThumb';
import { MediaIcons } from '../../components/MediaIcons';
import { formatArabicDate } from '../../utils/helpers';

// The featured lesson: large, with its frame and the one action
export const FeaturedCard: React.FC<{ lesson: LessonWithRelations }> = ({ lesson }) => (
  <article className="rounded-xl bg-mushaf text-white overflow-hidden border-b-4 border-gold">
    <div className="grid grid-cols-[84px_minmax(0,1fr)] min-[360px]:grid-cols-[108px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 sm:gap-6 p-4 sm:p-7 items-center">
      <div className="order-2 sm:order-none min-w-0 space-y-2 sm:space-y-4">
        <h3 className="font-sans text-base min-[360px]:text-lg sm:text-3xl font-bold leading-snug text-balance line-clamp-3 sm:line-clamp-none">
          <Link to={`/lesson/${lesson.id}`} className="hover:text-gold-soft transition-colors">
            {lesson.title}
          </Link>
        </h3>
        <p className="-mt-1 sm:-mt-2 text-xs sm:text-sm text-gold-soft">
          {[lesson.series?.title && `من: ${lesson.series.title}`, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
        </p>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            to={`/lesson/${lesson.id}`}
            className="press inline-flex items-center whitespace-nowrap gap-1.5 min-[360px]:gap-2 h-11 sm:h-12 px-2.5 min-[360px]:px-4 sm:px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep text-[13px] min-[360px]:text-sm sm:text-base font-bold"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            شاهد واستمع الآن
          </Link>
          <span className="hidden sm:inline-flex">
            <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
          </span>
        </div>
      </div>
      <div className="order-1 sm:order-none">
        <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} className="w-full" />
      </div>
    </div>
  </article>
);
