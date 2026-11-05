// Reading the transcript: its paragraphs, the one being read (estimated from playback) and reading statistics.
import { useEffect, useMemo } from 'react';
import { trackReading, trackView } from '../../services/analytics';
import type { Lesson } from '../../types';
import type { TabType } from './useLessonTabs';

export function useTranscriptReading(
  lesson: Lesson | null,
  activeTab: TabType,
  position: { seconds: number; duration: number },
  countView: () => void
) {
  const lessonId = lesson?.id;

  // Reading time counts while the transcript tab is open; the first scroll is what counts as a view
  useEffect(() => {
    if (!lessonId || activeTab !== 'transcript') return;
    const key = `lesson:${lessonId}`;
    const stopTime = trackReading(key);
    const onFirstScroll = () => {
      trackView('read', key);
      countView();
    };
    window.addEventListener('scroll', onFirstScroll, { capture: true, once: true, passive: true });
    return () => {
      stopTime();
      window.removeEventListener('scroll', onFirstScroll, true);
    };
    // countView only changes when the lesson does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, activeTab]);

  const paragraphs = useMemo(
    () =>
      (lesson?.transcript || '')
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
    [lesson?.transcript]
  );

  // The transcript has no timestamps, so the current paragraph is estimated from how far the media has played
  const activeParagraph =
    position.duration > 0 && paragraphs.length > 0
      ? Math.min(paragraphs.length - 1, Math.floor((position.seconds / position.duration) * paragraphs.length))
      : -1;

  // Opening the transcript brings the paragraph being read into view
  useEffect(() => {
    if (activeTab !== 'transcript' || activeParagraph < 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`para-${activeParagraph}`)?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    // Only when the tab changes; following playback should not keep scrolling the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return { paragraphs, activeParagraph };
}

export type TranscriptReading = ReturnType<typeof useTranscriptReading>;
