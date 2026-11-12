// Which forms of the lesson exist, which one is shown, and the first one to open on. The video and the recording
// are one tab ("الدرس"): the shared player (MediaStage) switches between watching and listening inside it.
import { useEffect, useState } from 'react';
import { getYouTubeId } from '../../lib/youtube';
import type { Lesson } from '../../types';

export type TabType = 'media' | 'transcript';

export const TAB_LABELS: Record<TabType, string> = {
  media: 'الدرس',
  transcript: 'قراءة',
};

export function useLessonTabs(lesson: Lesson | null) {
  const [activeTab, setActiveTab] = useState<TabType>('media');

  // Open on the first kind of media the lesson actually has
  useEffect(() => {
    if (!lesson) return;
    setActiveTab(getYouTubeId(lesson.youtube_url) || lesson.audio_url ? 'media' : 'transcript');
  }, [lesson?.id]);

  const available: TabType[] = lesson
    ? [
        ...(getYouTubeId(lesson.youtube_url) || lesson.audio_url ? (['media'] as const) : []),
        ...(lesson.transcript?.trim() ? (['transcript'] as const) : []),
      ]
    : [];
  const shown = available.includes(activeTab) ? activeTab : available[0];

  return { activeTab, setActiveTab, available, shown, isMedia: shown === 'media' };
}

export type LessonTabs = ReturnType<typeof useLessonTabs>;
