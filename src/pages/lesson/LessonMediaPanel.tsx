// The lesson's player area: the tabs, the video or audio player, and the transcript.
import React from 'react';
import { AudioPlayer } from '../../components/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer';
import { getYouTubeId } from '../../lib/youtube';
import { type Lesson, type Series } from '../../types';
import { TranscriptPanel } from './TranscriptPanel';
import { TAB_LABELS, type LessonTabs } from './useLessonTabs';
import { type LessonPlayback } from './useLessonPlayback';
import { type TranscriptReading } from './useTranscriptReading';
import { type TranscriptFont } from './useTranscriptFont';
import { type Share } from './useShare';

export const LessonMediaPanel: React.FC<{
  lesson: Lesson;
  series: Series;
  resumeAt: number;
  tabs: LessonTabs;
  playback: LessonPlayback;
  reading: TranscriptReading;
  font: TranscriptFont;
  share: Share;
}> = ({ lesson, series, resumeAt, tabs, playback, reading, font, share }) => {
  const videoId = getYouTubeId(lesson.youtube_url);
  // Tabs only when the lesson has more than one form
  return (
    <section aria-label="محتوى الدرس" data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties} className="space-y-3 sm:space-y-4">
      {tabs.available.length > 1 && (
        <div role="tablist" aria-label="طريقة متابعة الدرس" className="inline-flex p-1 rounded-2xl bg-stone-100 dark:bg-stone-900">
          {tabs.available.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-${tab}`}
              aria-selected={tabs.shown === tab}
              aria-controls="lesson-panel"
              onClick={() => tabs.setActiveTab(tab)}
              className={`h-11 px-5 rounded-lg text-sm font-semibold transition-colors ${
                tabs.shown === tab
                  ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-300'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      <div
        id="lesson-panel"
        role={tabs.available.length > 1 ? 'tabpanel' : undefined}
        aria-labelledby={tabs.available.length > 1 ? `tab-${tabs.shown}` : undefined}
      >
        {!tabs.shown && (
          <p className="py-10 text-stone-600 dark:text-stone-400">لم يُرفع تسجيل ولا تفريغ لهذا الدرس بعد.</p>
        )}

        {tabs.shown === 'video' && videoId && (
          <VideoPlayer
            ref={playback.mediaRef}
            youtubeUrl={lesson.youtube_url}
            title={lesson.title}
            startAt={resumeAt}
            onTimeUpdate={playback.onVideoTime}
            onEnded={playback.onMediaEnded}
          />
        )}

        {tabs.shown === 'audio' && (
          <AudioPlayer
            ref={playback.mediaRef}
            track={{ id: lesson.id, title: lesson.title, subtitle: series.title, src: lesson.audio_url, href: `/lesson/${lesson.id}` }}
            startAt={resumeAt}
            onTimeUpdate={playback.onMediaTime}
            onEnded={playback.onMediaEnded}
          />
        )}

        {tabs.shown === 'transcript' && <TranscriptPanel reading={reading} font={font} share={share} />}
      </div>
    </section>
  );
};
