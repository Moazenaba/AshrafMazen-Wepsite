// Which forms of the lesson exist (video, audio, transcript), which one is shown, and the first one to open on.
import { useEffect, useState } from 'react';
import { getYouTubeId } from '../../lib/youtube';
import type { Lesson } from '../../types';

export type TabType = 'video' | 'audio' | 'transcript';

export const TAB_LABELS: Record<TabType, string> = {
  video: 'مشاهدة',
  audio: 'استماع',
  transcript: 'قراءة',
};

export function useLessonTabs(lesson: Lesson | null) {
  const [activeTab, setActiveTab] = useState<TabType>('video');

  // Open on the first kind of media the lesson actually has
  useEffect(() => {
    if (!lesson) return;
    if (lesson.youtube_url) setActiveTab('video');
    else if (lesson.audio_url) setActiveTab('audio');
    else setActiveTab('transcript');
  }, [lesson?.id]);

  const available: TabType[] = lesson
    ? [
        ...(getYouTubeId(lesson.youtube_url) ? (['video'] as const) : []),
        ...(lesson.audio_url ? (['audio'] as const) : []),
        ...(lesson.transcript?.trim() ? (['transcript'] as const) : []),
      ]
    : [];
  const shown = available.includes(activeTab) ? activeTab : available[0];

  return { activeTab, setActiveTab, available, shown, isMedia: shown === 'video' || shown === 'audio' };
}

export type LessonTabs = ReturnType<typeof useLessonTabs>;
