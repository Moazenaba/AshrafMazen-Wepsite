import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useBookmarks } from '../services/bookmarkService';
import { isLessonWatched } from '../services/progressService';
import { activeChapterIndex } from '../utils/chapters';
import { ReportLink } from '../components/ReportLink';
import { AutoNextBanner } from './lesson/AutoNextBanner';
import { ChapterList } from './lesson/ChapterList';
import { LessonHeader } from './lesson/LessonHeader';
import { LessonMediaPanel } from './lesson/LessonMediaPanel';
import { LessonNav } from './lesson/LessonNav';
import { LessonNotFound, LessonSkeleton } from './lesson/LessonStates';
import { ReadingNow } from './lesson/ReadingNow';
import { SeriesLessonsList } from './lesson/SeriesLessonsList';
import { siblingsOf } from './lesson/siblings';
import { useLessonData } from './lesson/useLessonData';
import { useLessonPlayback } from './lesson/useLessonPlayback';
import { useLessonSeo } from './lesson/useLessonSeo';
import { useLessonTabs } from './lesson/useLessonTabs';
import { useShare } from './lesson/useShare';
import { useTranscriptFont } from './lesson/useTranscriptFont';
import { useTranscriptReading } from './lesson/useTranscriptReading';
import { useViewCounter } from './lesson/viewCounter';

// One lesson: video, audio and transcript, its chapters, and the other lessons of its series.
// Behaviour lives in the use* hooks beside this file (./lesson); this file puts the parts together.
export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // ?t=<seconds> opens the lesson at that moment (the chapter links given to search engines use it)
  const [searchParams] = useSearchParams();
  const linkedSecond = Math.max(0, Math.floor(Number(searchParams.get('t')) || 0));

  const { lesson, series, category, seriesLessons, loading, resumeAt } = useLessonData(id, linkedSecond);
  const { prevLesson, nextLesson } = siblingsOf(seriesLessons, lesson?.id);
  const tabs = useLessonTabs(lesson);
  const countView = useViewCounter(lesson);
  const playback = useLessonPlayback(lesson, nextLesson, id, countView);
  const reading = useTranscriptReading(lesson, tabs.activeTab, playback.position, countView);
  const font = useTranscriptFont();
  const share = useShare(lesson, series);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  useLessonSeo(lesson, series);

  if (loading) return <LessonSkeleton />;
  if (!lesson || !series) return <LessonNotFound />;

  const chapters = lesson.chapters ?? [];
  const currentChapter = playback.position.duration > 0 ? activeChapterIndex(chapters, playback.position.seconds) : -1;
  const watchedIds = new Set(seriesLessons.filter((l) => isLessonWatched(l.id)).map((l) => l.id));
  const { isMedia } = tabs;
  const { activeParagraph, paragraphs } = reading;
  const seekTo = playback.seekTo;
  const countdown = playback.countdown;

  return (
    <article className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-5 sm:space-y-8">
      {share.isShareCopied && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold" /* taste-skill-ignore: floating toast overlay */
        >
          تم نسخ رابط الدرس
        </div>
      )}

      {lesson.status !== 'published' && (
        <p role="note" className="p-4 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 font-semibold">
          معاينة مسودة: هذا الدرس غير منشور، ولا يراه إلا المشرفون.
        </p>
      )}

      <LessonHeader
        lesson={lesson}
        series={series}
        category={category}
        watched={isLessonWatched(lesson.id)}
        bookmarked={isBookmarked(lesson.id)}
        onToggleBookmark={() => toggleBookmark(lesson.id)}
        onShare={share.share}
      />

      <LessonMediaPanel lesson={lesson} series={series} resumeAt={resumeAt} tabs={tabs} playback={playback} reading={reading} font={font} share={share} />

      {/* Chapters: jump straight to a part of the lesson */}
      {isMedia && chapters.length > 0 && (
        <ChapterList chapters={chapters} currentChapter={currentChapter} onSeek={seekTo} />
      )}

      {/* The paragraph being read, estimated from playback, with a way into the full text */}
      {isMedia && activeParagraph >= 0 && paragraphs.length > 0 && (
        <ReadingNow paragraph={paragraphs[activeParagraph]} onOpenTranscript={() => tabs.setActiveTab('transcript')} />
      )}

      {/* Auto-next: the next lesson starts unless the visitor cancels */}
      {countdown !== null && nextLesson && (
        <AutoNextBanner countdown={countdown} nextLesson={nextLesson} onCancel={() => playback.cancelCountdown()} />
      )}

      <LessonNav prev={prevLesson} next={nextLesson} />

      {seriesLessons.length > 1 && (
        <SeriesLessonsList seriesTitle={series.title} lessons={seriesLessons} currentId={lesson.id} watchedIds={watchedIds} />
      )}
      <ReportLink />
    </article>
  );
};
