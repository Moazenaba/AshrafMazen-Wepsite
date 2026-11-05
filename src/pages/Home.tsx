// The home page. Data loading, placing each lesson once, and the feed are in ./home; its sections are components there too.
import React, { useMemo, useState } from 'react';
import { DEFAULT_SITE_SETTINGS } from '../services/dataService';
import { getLessonProgress, getResumeSeconds } from '../services/progressService';
import { getRecentLesson } from '../services/recentLessonService';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { QuoteTicker } from '../components/QuoteTicker';
import { useSiteContent } from '../hooks/useSiteContent';
import { HeroSection } from './home/HeroSection';
import { FeaturedColumn } from './home/FeaturedColumn';
import { SciencesColumn } from './home/SciencesColumn';
import { SideColumn } from './home/SideColumn';
import { ChannelPlaylists } from './home/ChannelPlaylists';
import { AboutSection } from './home/AboutSection';
import { placeLessons } from './home/placeLessons';
import { buildCategoryOptions, buildLatestItems } from './home/latestFeed';
import { JUMUAH_PLAYLIST_ID } from './home/sermons';
import { todayLine } from './home/todayLine';
import { useHomeData } from './home/useHomeData';

export const Home: React.FC = () => {
  const library = useYoutubeLibrary();
  const { categories, featuredList, latestList, viewedList, sermonList, settings, loaded: dataLoaded } = useHomeData();
  const { content, loaded } = useSiteContent();
  const [recentLesson] = useState(getRecentLesson);

  const placed = useMemo(
    () => placeLessons({ featuredList, categories, latestList, viewedList, sermonList, recentLesson }),
    [featuredList, categories, latestList, viewedList, sermonList, recentLesson]
  );
  const latestItems = useMemo(() => buildLatestItems(latestList, library), [latestList, library]);
  const activeCategories = useMemo(() => categories.filter((cat) => cat.lessonCount > 0), [categories]);
  const categoryOptions = useMemo(() => buildCategoryOptions(activeCategories, library), [activeCategories, library]);

  const displayName = settings.banner_name || DEFAULT_SITE_SETTINGS.banner_name;
  const aboutText = settings.about_sheikh || DEFAULT_SITE_SETTINGS.about_sheikh || '';
  const visibleLibrary = library.filter((p) => p.id !== JUMUAH_PLAYLIST_ID);
  const recentResume = recentLesson ? getResumeSeconds(recentLesson.id) : 0;
  const recentDuration = recentLesson ? (getLessonProgress(recentLesson.id)?.duration ?? 0) : 0;

  return (
    <div className="pb-8 sm:pb-20">
      {/* The hero: the name, and beneath it one hadith set in the script of the books of knowledge */}
      <HeroSection displayName={displayName} todayLine={todayLine()} hero={content.hero} />

      {/* The quotes stay pinned under the top bar while the page scrolls, full width.
          On a short screen (a phone held sideways) they scroll away, so the pinned bars never fill the view */}
      {/* Until the sayings arrive the strip's space is held by an empty band of the same height, so the page doesn't jump */}
      {(!loaded || content.quotes.length > 0) && (
        <div className="sticky [@media(max-height:500px)]:static top-16 sm:top-[72px] z-30 bg-stone-50 dark:bg-stone-950 px-4 sm:px-6 lg:px-8 pt-1 pb-2 sm:py-2">
          {loaded ? (
            <QuoteTicker items={content.quotes} />
          ) : (
            <div aria-hidden="true" className="flex items-stretch rounded-xl bg-mushaf text-gold-soft overflow-hidden border-b-2 border-gold">
              <span className="shrink-0 flex items-center px-2.5 py-2 sm:px-5 sm:py-3 text-xs sm:text-base bg-gold text-mushaf-deep font-bold">أقوال وأحاديث</span>
              <span className="py-2 sm:py-3 font-amiri text-base sm:text-xl">&nbsp;</span>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <FeaturedColumn placed={placed} latestItems={latestItems} categoryOptions={categoryOptions} loading={!dataLoaded} />

          <SciencesColumn placed={placed} activeCategories={activeCategories} loading={!dataLoaded} />

          <SideColumn placed={placed} activeCategories={activeCategories} recentLesson={recentLesson} recentResume={recentResume} recentDuration={recentDuration} visibleLibrary={visibleLibrary} />

        </div>

        <ChannelPlaylists visibleLibrary={visibleLibrary} />

        <AboutSection aboutText={aboutText} />

      </div>
    </div>
  );
};
