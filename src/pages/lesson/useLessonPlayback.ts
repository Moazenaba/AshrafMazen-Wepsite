// Playback of a lesson: where it is, saving that place, watch statistics, and starting the next lesson.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MediaHandle } from '../../components/AudioPlayer';
import { createPlaybackMeter, trackView } from '../../services/analytics';
import { markLessonWatched, saveLessonPosition } from '../../services/progressService';
import type { Lesson } from '../../types';

// Seconds before the next lesson starts, and how often the position is written to this browser
const AUTO_NEXT_SECONDS = 5;
const SAVE_EVERY_SECONDS = 5;

export function useLessonPlayback(lesson: Lesson | null, nextLesson: Pick<Lesson, 'id'> | null, resetKey: string | undefined) {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ seconds: 0, duration: 0 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const mediaRef = useRef<MediaHandle>(null);
  const lastSavedRef = useRef(0);

  // Listening is measured by the audio engine itself; watching is measured here
  const lessonId = lesson?.id;
  const videoMeter = useMemo(() => (lessonId ? createPlaybackMeter('video', `lesson:${lessonId}`) : null), [lessonId]);

  // A new lesson starts from the beginning, with no countdown running
  useEffect(() => {
    setPosition({ seconds: 0, duration: 0 });
    setCountdown(null);
    lastSavedRef.current = 0;
  }, [resetKey]);

  // Auto-next: count down on the page, then move on unless the visitor cancels
  useEffect(() => {
    if (countdown === null) return;
    if (!nextLesson) {
      setCountdown(null);
      return;
    }
    if (countdown === 0) {
      navigate(`/lesson/${nextLesson.id}`);
      return;
    }
    const timer = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, nextLesson, navigate]);

  // Playback reports its position here: the transcript follows it, and it is saved every few seconds
  const onMediaTime = (seconds: number, duration: number) => {
    setPosition((prev) => (Math.floor(prev.seconds) === Math.floor(seconds) && prev.duration === duration ? prev : { seconds, duration }));
    if (lesson && Math.abs(seconds - lastSavedRef.current) >= SAVE_EVERY_SECONDS) {
      saveLessonPosition(lesson.id, seconds, duration);
      lastSavedRef.current = seconds;
    }
  };

  // The video player reports through here: the same page memory as the audio, plus the video statistics
  const onVideoTime = (seconds: number, duration: number) => {
    if (lesson) trackView('video', `lesson:${lesson.id}`);
    videoMeter?.update(seconds);
    onMediaTime(seconds, duration);
  };

  const onMediaEnded = () => {
    if (!lesson) return;
    markLessonWatched(lesson.id);
    if (nextLesson) setCountdown(AUTO_NEXT_SECONDS);
  };

  return {
    position,
    countdown,
    cancelCountdown: () => setCountdown(null),
    mediaRef,
    onMediaTime,
    onVideoTime,
    onMediaEnded,
    seekTo: (seconds: number) => mediaRef.current?.seek(seconds),
  };
}

export type LessonPlayback = ReturnType<typeof useLessonPlayback>;
