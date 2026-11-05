// What search engines read for a lesson: a short excerpt and the video data with its chapters.
import { getYouTubeThumbnail } from '../../lib/youtube';
import { type Lesson, type LessonChapter, type Series } from '../../types';

export function excerpt(text: string | null | undefined, max = 160): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

// What search engines read for a video lesson, including the chapters as key moments
export function buildVideoJsonLd(
  lesson: Lesson,
  series: Series,
  videoId: string,
  chapters: LessonChapter[],
  pageUrl: string
): Record<string, unknown> {
  const thumbnail = getYouTubeThumbnail(lesson.youtube_url);
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: lesson.title,
    description: excerpt(lesson.transcript) || `${series.title} - الشيخ أشرف مازن`,
    thumbnailUrl: thumbnail ? [thumbnail] : undefined,
    uploadDate: lesson.published_at || lesson.created_at,
    inLanguage: 'ar',
    url: pageUrl,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    hasPart: chapters.map((c) => ({
      '@type': 'Clip',
      name: c.title,
      startOffset: c.seconds,
      url: `${pageUrl}?t=${c.seconds}`,
    })),
  };
}
