// Title, description and video data for search engines and shared links, set while a lesson is shown.
import { useEffect } from 'react';
import { getYouTubeId } from '../../lib/youtube';
import type { Lesson, Series } from '../../types';
import { buildVideoJsonLd, excerpt } from './seo';

export function useLessonSeo(lesson: Lesson | null, series: Series | null): void {
  useEffect(() => {
    if (!lesson || !series) return;
    const previousTitle = document.title;
    document.title = `${lesson.title} - الشيخ أشرف مازن`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content ?? '';
    if (meta) meta.content = excerpt(lesson.transcript) || `${series.title} - الشيخ أشرف مازن`;

    let script: HTMLScriptElement | null = null;
    const videoId = getYouTubeId(lesson.youtube_url);
    if (videoId) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(buildVideoJsonLd(lesson, series, videoId, lesson.chapters ?? [], window.location.href));
      document.head.appendChild(script);
    }
    return () => {
      document.title = previousTitle;
      if (meta) meta.content = previousDescription;
      script?.remove();
    };
  }, [lesson, series]);
}
