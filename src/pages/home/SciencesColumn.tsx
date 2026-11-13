// Home page: The sciences (one card per category), the most viewed and the sermons.
import React from 'react';
import { Link } from 'react-router-dom';
import { type CategoryWithPortalData } from '../../services/dataService';
import { LessonThumb } from '../../components/LessonThumb';
import { MediaIcons } from '../../components/MediaIcons';
import { TopVideos } from '../../components/TopVideos';
import { formatArabicCount, formatArabicDate, COUNT_FORMS } from '../../utils/helpers';
import { Panel } from './Panel';
import { LessonRow } from './LessonRow';
import { type Placed } from './placeLessons';
import { CategoryGridSkeleton } from './Skeletons';
import { isSermonCategory, JUMUAH_PLAYLIST_ID, JUMUAH_LABEL } from './sermons';

export const SciencesColumn = ({ placed, activeCategories, loading }: { placed: Placed; activeCategories: CategoryWithPortalData[]; loading: boolean }) => (
      <div className="defer-render min-w-0 space-y-5 sm:space-y-8 lg:col-start-1 lg:row-start-2">
        {/* The sciences: the categories, one card each */}
        <Panel title="العلوم الشرعية والمتون" id="sciences-heading" anchor="categories">
          <div className="space-y-5">
            {loading && <CategoryGridSkeleton cards={2} />}
            {activeCategories.length > 0 && (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3">
                {placed.categoryBlocks.map(({ cat, newest }) => (
                  <li key={cat.id} className="h-full">
                    <Link
                      to={isSermonCategory(cat.name) ? `/playlist/${JUMUAH_PLAYLIST_ID}` : `/category/${cat.slug}`}
                      className="group flex flex-col h-full p-3 sm:p-5 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
                    >
                      <span className="font-sans text-base sm:text-xl font-bold text-mushaf dark:text-gold-soft transition-colors">
                        {isSermonCategory(cat.name) ? JUMUAH_LABEL : cat.name}
                      </span>
                      <span className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                        {formatArabicCount(cat.seriesCount, COUNT_FORMS.series)} · {formatArabicCount(cat.lessonCount, COUNT_FORMS.lesson)}
                      </span>
                      {newest && (
                        <span className="mt-auto pt-3 sm:pt-4 space-y-2">
                          <span className="block text-xs sm:text-sm leading-snug text-stone-800 dark:text-stone-200 line-clamp-2">{newest.title}</span>
                          <span className="hidden sm:inline-flex">
                            <MediaIcons youtubeUrl={newest.youtube_url} audioUrl={newest.audio_url} transcript={newest.transcript} />
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        {placed.newest.length > 0 && (
          <Panel title="الجديد من الدروس" id="latest-heading">
            <ol className="space-y-3">
              {placed.newest.map((lesson, i) => (
                <LessonRow key={lesson.id} lesson={lesson} rank={i + 1} />
              ))}
            </ol>
          </Panel>
        )}

        <TopVideos />

        {placed.viewed.length > 0 && (
          <Panel title="الأكثر مشاهدة" id="viewed-heading">
            <ol className="space-y-3">
              {placed.viewed.map((lesson, i) => (
                <LessonRow key={lesson.id} lesson={lesson} rank={i + 1} />
              ))}
            </ol>
          </Panel>
        )}

        {placed.sermons.length > 0 && (
          <Panel title="الخطب والمواعظ" id="sermons-heading">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {placed.sermons.map((lesson) => (
                <li key={lesson.id}>
                  <Link to={`/lesson/${lesson.id}`} className="group block space-y-2">
                    <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} className="w-full" />
                    <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
                      {lesson.title}
                    </span>
                    <span className="block text-sm text-stone-600 dark:text-stone-400">{formatArabicDate(lesson.published_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
);
