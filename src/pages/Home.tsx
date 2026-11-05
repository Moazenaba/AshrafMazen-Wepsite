// The home page. Data loading, placing each lesson once, and the feed are in ./home; its sections are components there too.
import React, { useMemo, useState } from 'react';
import { DEFAULT_SITE_SETTINGS } from '../services/dataService';
import { getLessonProgress, getResumeSeconds } from '../services/progressService';
import { getRecentLesson } from '../services/recentLessonService';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { QuoteTicker } from '../components/QuoteTicker';
import { TICKER_QUOTES } from '../constants/tickerQuotes';
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
  const { categories, featuredList, latestList, viewedList, sermonList, settings } = useHomeData();
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
      <HeroSection displayName={displayName} todayLine={todayLine()} />

      {/* The quotes stay pinned under the top bar while the page scrolls, full width.
          On a short screen (a phone held sideways) they scroll away, so the pinned bars never fill the view */}
      <div className="sticky [@media(max-height:500px)]:static top-16 sm:top-[72px] z-30 bg-stone-50 dark:bg-stone-950 px-4 sm:px-6 lg:px-8 pt-1 pb-2 sm:py-2">
        <QuoteTicker items={TICKER_QUOTES} />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <FeaturedColumn placed={placed} latestItems={latestItems} categoryOptions={categoryOptions} />

          <SciencesColumn placed={placed} activeCategories={activeCategories} />

          <SideColumn placed={placed} activeCategories={activeCategories} recentLesson={recentLesson} recentResume={recentResume} recentDuration={recentDuration} visibleLibrary={visibleLibrary} />

        </div>

        <ChannelPlaylists visibleLibrary={visibleLibrary} />

        <AboutSection aboutText={aboutText} />

      </div>
    </div>
  );
};
