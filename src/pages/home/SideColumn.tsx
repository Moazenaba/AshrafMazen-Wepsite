// Home page: The menu, the continue card and the newest video.
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Play } from 'lucide-react';
import { type CategoryWithPortalData } from '../../services/dataService';
import { type RecentLesson } from '../../services/recentLessonService';
import { LessonThumb } from '../../components/LessonThumb';
import { Panel } from './Panel';
import { ContinueCard, continueHref } from './ContinueCard';
import { type LibraryPlaylist } from '../../data/youtube-library';
import { type Placed } from './placeLessons';
import { isSermonCategory, JUMUAH_PLAYLIST_ID, JUMUAH_LABEL } from './sermons';

export const SideColumn = ({ placed, activeCategories, recentLesson, recentResume, recentDuration, visibleLibrary }: { placed: Placed; activeCategories: CategoryWithPortalData[]; recentLesson: RecentLesson | null; recentResume: number; recentDuration: number; visibleLibrary: LibraryPlaylist[] }) => (
  <>
        <aside className="min-w-0 lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col" aria-label="القائمة الجانبية">
          <Panel title="القائمة" id="menu-heading" className="lg:flex-1">
            <ul className="flex flex-wrap gap-2 sm:block sm:space-y-1">
              <li>
                <Link to="/search" className="inline-flex max-w-full items-center min-h-11 px-4 rounded-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700 sm:flex sm:justify-between sm:rounded-lg sm:px-3 sm:bg-transparent dark:sm:bg-transparent">
                  كل الدروس
                  <ChevronLeft className="hidden sm:block w-4 h-4" aria-hidden="true" />
                </Link>
              </li>
              {activeCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={isSermonCategory(cat.name) ? `/playlist/${JUMUAH_PLAYLIST_ID}` : `/category/${cat.slug}`}
                    className="inline-flex max-w-full items-center min-h-11 px-4 rounded-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700 sm:flex sm:justify-between sm:rounded-lg sm:px-3 sm:bg-transparent dark:sm:bg-transparent"
                  >
                    {isSermonCategory(cat.name) ? JUMUAH_LABEL : cat.name}
                    <ChevronLeft className="hidden sm:block w-4 h-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              {visibleLibrary.map((playlist) => (
                <li key={playlist.id}>
                  <Link
                    to={`/playlist/${playlist.id}`}
                    className="inline-flex max-w-full items-center min-h-11 px-4 rounded-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700 sm:flex sm:justify-between sm:rounded-lg sm:px-3 sm:bg-transparent dark:sm:bg-transparent"
                  >
                    <span className="min-w-0 truncate">{playlist.title}</span>
                    <span className="sr-only"> ({playlist.count})</span>
                    <ChevronLeft className="hidden sm:block w-4 h-4 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>

        <div className="min-w-0 space-y-8 lg:col-start-2 lg:row-start-2">
          {recentLesson && (
            <ContinueCard
              href={continueHref(recentLesson.id)}
              title={recentLesson.title}
              seriesTitle={recentLesson.seriesTitle}
              seconds={recentResume}
              duration={recentDuration}
            />
          )}

          {placed.video && (
            <Panel title="أحدث درس مرئي" id="video-heading">
              <Link to={`/lesson/${placed.video.id}`} className="group block space-y-3">
                <span className="relative block">
                  <LessonThumb youtubeUrl={placed.video.youtube_url} audioUrl={placed.video.audio_url} className="w-full" />
                  <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gold text-mushaf-deep">
                      <Play className="w-5 h-5 fill-current ms-0.5" />
                    </span>
                  </span>
                </span>
                <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
                  {placed.video.title}
                </span>
              </Link>
            </Panel>
          )}
        </div>
  </>
);
