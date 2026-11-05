import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Copy, Check, Bookmark, Clock } from 'lucide-react';
import {
  getLesson,
  getSeries,
  getCategory,
  getLessonsBySeries,
  incrementLessonViews,
} from '../services/dataService';
import {
  getArabicLessonOrdinal,
  formatArabicDate,
  formatArabicCount,
  formatAudioTime,
  COUNT_FORMS,
} from '../utils/helpers';
import { AudioPlayer, type MediaHandle } from '../components/AudioPlayer';
import { VideoPlayer } from '../components/VideoPlayer';
import { useBookmarks } from '../services/bookmarkService';
import { saveRecentLesson } from '../services/recentLessonService';
import {
  getResumeSeconds,
  saveLessonPosition,
  markLessonWatched,
  isLessonWatched,
} from '../services/progressService';
import { activeChapterIndex } from '../utils/chapters';
import { createPlaybackMeter, trackReading, trackView } from '../services/analytics';
import { ReportLink } from '../components/ReportLink';
import { getYouTubeId, getYouTubeThumbnail } from '../lib/youtube';
import type { Lesson, LessonChapter, Series, Category } from '../types';

type TabType = 'video' | 'audio' | 'transcript';

const TAB_LABELS: Record<TabType, string> = {
  video: 'مشاهدة',
  audio: 'استماع',
  transcript: 'قراءة',
};

const FONT_SIZE_KEY = 'transcript_font_size';
const DEFAULT_FONT_SIZE = 20;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 30;

// Seconds before the next lesson starts, and how often the position is written to this browser
const AUTO_NEXT_SECONDS = 5;
const SAVE_EVERY_SECONDS = 5;

function readStoredFontSize(): number {
  try {
    const stored = parseInt(localStorage.getItem(FONT_SIZE_KEY) || '', 10);
    if (stored >= MIN_FONT_SIZE && stored <= MAX_FONT_SIZE) return stored;
  } catch {}
  return DEFAULT_FONT_SIZE;
}

function excerpt(text: string | null | undefined, max = 160): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

// What search engines read for a video lesson, including the chapters as key moments
function buildVideoJsonLd(
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

export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [seriesLessons, setSeriesLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [fontSize, setFontSize] = useState<number>(readStoredFontSize);
  const [isCopied, setIsCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumeAt, setResumeAt] = useState(0);
  const [position, setPosition] = useState({ seconds: 0, duration: 0 });
  const [countdown, setCountdown] = useState<number | null>(null);

  const mediaRef = useRef<MediaHandle>(null);
  const lastSavedRef = useRef(0);

  // Statistics. Listening is measured by the audio engine itself; watching and reading are measured here
  const lessonId = lesson?.id;
  const videoMeter = useMemo(() => (lessonId ? createPlaybackMeter('video', `lesson:${lessonId}`) : null), [lessonId]);
  useEffect(() => {
    if (!lessonId || activeTab !== 'transcript') return;
    trackView('read', `lesson:${lessonId}`);
    return trackReading(`lesson:${lessonId}`);
  }, [lessonId, activeTab]);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = lesson ? isBookmarked(lesson.id) : false;

  useEffect(() => {
    let isMounted = true;
    async function loadLessonData() {
      if (!id) return;
      try {
        setLoading(true);
        setPosition({ seconds: 0, duration: 0 });
        setCountdown(null);
        lastSavedRef.current = 0;
        // Increment views once per browser session
        incrementLessonViews(id);

        // Visitors must never see lessons with status 'draft' -> includeDrafts = false
        const l = await getLesson(id, false);
        if (!l) {
          if (isMounted) {
            setLesson(null);
            setLoading(false);
          }
          return;
        }

        const [s, pubLessons] = await Promise.all([
          getSeries(l.series_id),
          getLessonsBySeries(l.series_id, false),
        ]);

        let cat: Category | null = null;
        if (s) {
          cat = await getCategory(s.category_id);
        }

        if (isMounted) {
          setLesson(l);
          setSeries(s);
          setCategory(cat);
          setSeriesLessons(pubLessons);
          setResumeAt(getResumeSeconds(l.id));
          saveRecentLesson({ id: l.id, title: l.title, seriesTitle: s?.title });

          // Open on the first kind of media the lesson actually has
          if (l.youtube_url) setActiveTab('video');
          else if (l.audio_url) setActiveTab('audio');
          else setActiveTab('transcript');
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLessonData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Previous and next published lessons in this series
  const currentIndex = seriesLessons.findIndex((l) => l.id === lesson?.id);
  const prevLesson = currentIndex > 0 ? seriesLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex !== -1 && currentIndex < seriesLessons.length - 1 ? seriesLessons[currentIndex + 1] : null;

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

  // Title, description and video data for search engines and shared links
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
      script.textContent = JSON.stringify(
        buildVideoJsonLd(lesson, series, videoId, lesson.chapters ?? [], window.location.href)
      );
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      if (meta) meta.content = previousDescription;
      script?.remove();
    };
  }, [lesson, series]);

  const changeFontSize = (next: number) => {
    const clamped = Math.min(Math.max(next, MIN_FONT_SIZE), MAX_FONT_SIZE);
    setFontSize(clamped);
    try {
      localStorage.setItem(FONT_SIZE_KEY, String(clamped));
    } catch {}
  };

  const handleCopyTranscript = () => {
    if (!lesson?.transcript) return;
    navigator.clipboard.writeText(lesson.transcript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${lesson?.title} - الشيخ أشرف مازن`,
          text: `درس ${lesson?.title} من ${series?.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    }
  };

  // Playback reports its position here: the transcript follows it, and it is saved every few seconds
  const handleMediaTime = (seconds: number, duration: number) => {
    setPosition((prev) =>
      Math.floor(prev.seconds) === Math.floor(seconds) && prev.duration === duration ? prev : { seconds, duration }
    );
    if (lesson && Math.abs(seconds - lastSavedRef.current) >= SAVE_EVERY_SECONDS) {
      saveLessonPosition(lesson.id, seconds, duration);
      lastSavedRef.current = seconds;
    }
  };

  // The video player reports through here: the same page memory as the audio, plus the video statistics
  const handleVideoTime = (seconds: number, duration: number) => {
    if (lesson) trackView('video', `lesson:${lesson.id}`);
    videoMeter?.update(seconds);
    handleMediaTime(seconds, duration);
  };

  const handleMediaEnded = () => {
    if (!lesson) return;
    markLessonWatched(lesson.id);
    if (nextLesson) setCountdown(AUTO_NEXT_SECONDS);
  };

  const seekTo = (seconds: number) => mediaRef.current?.seek(seconds);

  // The transcript has no timestamps, so the current paragraph is estimated from how far the media has played
  const paragraphs = useMemo(
    () =>
      (lesson?.transcript || '')
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
    [lesson?.transcript]
  );
  const activeParagraph =
    position.duration > 0 && paragraphs.length > 0
      ? Math.min(paragraphs.length - 1, Math.floor((position.seconds / position.duration) * paragraphs.length))
      : -1;

  // Opening the transcript brings the paragraph being read into view
  useEffect(() => {
    if (activeTab !== 'transcript' || activeParagraph < 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(`para-${activeParagraph}`)
      ?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    // Only when the tab changes; following playback should not keep scrolling the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6" aria-busy="true">
        <div className="h-5 w-56 bg-stone-200 dark:bg-stone-900 rounded" />
        <div className="h-10 w-3/4 bg-stone-200 dark:bg-stone-900 rounded" />
        <div className="aspect-video bg-stone-200 dark:bg-stone-900 rounded-2xl" />
      </div>
    );
  }

  if (!lesson || !series) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 space-y-4">
        <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">الدرس غير متاح</h1>
        <p className="text-stone-600 dark:text-stone-400">هذا الدرس غير موجود، أو لم يُنشر بعد.</p>
        <Link to="/" className="inline-flex items-center min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const videoId = getYouTubeId(lesson.youtube_url);
  const availableTabs: TabType[] = [
    ...(videoId ? (['video'] as const) : []),
    ...(lesson.audio_url ? (['audio'] as const) : []),
    ...(lesson.transcript?.trim() ? (['transcript'] as const) : []),
  ];
  const shownTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];
  const isMediaTab = shownTab === 'video' || shownTab === 'audio';

  const chapters = lesson.chapters ?? [];
  const currentChapter = position.duration > 0 ? activeChapterIndex(chapters, position.seconds) : -1;
  const watched = isLessonWatched(lesson.id);

  const metaLine = [
    getArabicLessonOrdinal(lesson.lesson_number),
    formatArabicDate(lesson.published_at),
    typeof lesson.views === 'number' && lesson.views > 0 ? formatArabicCount(lesson.views, COUNT_FORMS.view) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const actionButton =
    'press inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200';

  const watchedIds = new Set(seriesLessons.filter((l) => isLessonWatched(l.id)).map((l) => l.id));

  return (
    <article className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-5 sm:space-y-8">
      {isShareCopied && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold" /* taste-skill-ignore: floating toast overlay */
        >
          تم نسخ رابط الدرس
        </div>
      )}

      <header data-reveal className="space-y-3 sm:space-y-4">
        <nav aria-label="مسار التصفح" className="flex items-center flex-wrap gap-1 text-sm text-stone-600 dark:text-stone-400">
          <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            الرئيسية
          </Link>
          {category && (
            <>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <Link to={`/category/${category.slug}`} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
                {category.name}
              </Link>
            </>
          )}
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <Link to={`/series/${series.slug}`} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            {series.title}
          </Link>
        </nav>

        <h1 className="font-amiri text-3xl sm:text-5xl font-bold leading-snug text-emerald-950 dark:text-stone-100 text-balance">
          {lesson.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-stone-600 dark:text-stone-400">{metaLine}</p>
            {watched && (
              <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>تمّت متابعته</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleBookmark(lesson.id)}
              aria-pressed={bookmarked}
              className={actionButton}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current text-amber-600 dark:text-amber-400' : ''}`} />
              <span>{bookmarked ? 'محفوظ' : 'حفظ'}</span>
            </button>
            <button type="button" onClick={handleShare} className={actionButton}>
              <Share2 className="w-4 h-4" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Media: tabs only when the lesson has more than one form */}
      <section aria-label="محتوى الدرس" data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties} className="space-y-3 sm:space-y-4">
        {availableTabs.length > 1 && (
          <div role="tablist" aria-label="طريقة متابعة الدرس" className="inline-flex p-1 rounded-2xl bg-stone-100 dark:bg-stone-900">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`tab-${tab}`}
                aria-selected={shownTab === tab}
                aria-controls="lesson-panel"
                onClick={() => setActiveTab(tab)}
                className={`h-11 px-5 rounded-lg text-sm font-semibold transition-colors ${
                  shownTab === tab
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
          role={availableTabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={availableTabs.length > 1 ? `tab-${shownTab}` : undefined}
        >
          {!shownTab && (
            <p className="py-10 text-stone-600 dark:text-stone-400">لم يُرفع تسجيل ولا تفريغ لهذا الدرس بعد.</p>
          )}

          {shownTab === 'video' && videoId && (
            <VideoPlayer
              ref={mediaRef}
              youtubeUrl={lesson.youtube_url}
              title={lesson.title}
              startAt={resumeAt}
              onTimeUpdate={handleVideoTime}
              onEnded={handleMediaEnded}
            />
          )}

          {shownTab === 'audio' && (
            <AudioPlayer
              ref={mediaRef}
              track={{ id: lesson.id, title: lesson.title, subtitle: series.title, src: lesson.audio_url, href: `/lesson/${lesson.id}` }}
              startAt={resumeAt}
              onTimeUpdate={handleMediaTime}
              onEnded={handleMediaEnded}
            />
          )}

          {shownTab === 'transcript' && (
            <div className="card px-4 py-5 sm:px-10 sm:py-10 space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1" role="group" aria-label="حجم الخط">
                  <button
                    type="button"
                    onClick={() => changeFontSize(fontSize - 2)}
                    disabled={fontSize <= MIN_FONT_SIZE}
                    aria-label="تصغير الخط"
                    className="press w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold disabled:opacity-40"
                  >
                    أ−
                  </button>
                  <button
                    type="button"
                    onClick={() => changeFontSize(fontSize + 2)}
                    disabled={fontSize >= MAX_FONT_SIZE}
                    aria-label="تكبير الخط"
                    className="press w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-lg disabled:opacity-40"
                  >
                    أ+
                  </button>
                </div>
                <button type="button" onClick={handleCopyTranscript} className={actionButton}>
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span aria-live="polite">{isCopied ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>

              <div
                className="max-w-[65ch] mx-auto font-amiri text-stone-900 dark:text-stone-100 leading-[2] space-y-4"
                style={{ fontSize: `${fontSize}px` }}
              >
                {paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    id={`para-${i}`}
                    className={`whitespace-pre-wrap rounded-lg transition-colors ${
                      i === activeParagraph ? '-mx-3 px-3 py-2 bg-amber-100/70 dark:bg-amber-400/15' : ''
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Chapters: jump straight to a part of the lesson */}
      {isMediaTab && chapters.length > 0 && (
        <section aria-labelledby="chapters-heading" className="card p-4 sm:p-5 space-y-3">
          <h2 id="chapters-heading" className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
            <Clock className="w-5 h-5 text-emerald-800 dark:text-amber-400" aria-hidden="true" />
            <span>فصول الدرس</span>
          </h2>
          <ol className="space-y-1">
            {chapters.map((chapter, i) => (
              <li key={`${chapter.seconds}-${i}`}>
                <button
                  type="button"
                  onClick={() => seekTo(chapter.seconds)}
                  aria-current={i === currentChapter ? 'true' : undefined}
                  className={`w-full flex items-baseline gap-4 px-3 py-2.5 rounded-xl text-start transition-colors ${
                    i === currentChapter
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="shrink-0 w-16 text-sm text-stone-600 dark:text-stone-400 tabular-nums">
                    {formatAudioTime(chapter.seconds)}
                  </span>
                  <span>{chapter.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* The paragraph being read, estimated from playback, with a way into the full text */}
      {isMediaTab && activeParagraph >= 0 && paragraphs.length > 0 && (
        <section aria-labelledby="reading-now-heading" className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="reading-now-heading" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              الفقرة الحالية من التفريغ <span className="font-normal text-stone-500 dark:text-stone-400">(تقريبية)</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('transcript')}
              className="link-grow inline-flex items-center min-h-11 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
            >
              اقرأ التفريغ كاملاً
            </button>
          </div>
          <p className="font-amiri text-lg leading-loose text-stone-900 dark:text-stone-100 line-clamp-3">
            {paragraphs[activeParagraph]}
          </p>
        </section>
      )}

      {/* Auto-next: the next lesson starts unless the visitor cancels */}
      {countdown !== null && nextLesson && (
        <section aria-label="الدرس التالي" className="card p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              الدرس التالي بعد {new Intl.NumberFormat('ar-EG').format(countdown)} ثوانٍ
            </p>
            <p className="font-semibold text-stone-900 dark:text-stone-100">{nextLesson.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCountdown(null)}
              className="press inline-flex items-center h-11 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold"
            >
              إلغاء
            </button>
            <Link
              to={`/lesson/${nextLesson.id}`}
              className="press inline-flex items-center h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold"
            >
              ابدأ الآن
            </Link>
          </div>
        </section>
      )}

      {(prevLesson || nextLesson) && (
        <nav aria-label="التنقل بين دروس السلسلة" data-reveal className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {prevLesson ? (
            <Link
              to={`/lesson/${prevLesson.id}`}
              className="card block p-4 sm:p-5"
            >
              <span className="block text-sm text-stone-600 dark:text-stone-400">السابق</span>
              <span className="block mt-1 font-semibold text-stone-900 dark:text-stone-100">{prevLesson.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {nextLesson && (
            <Link
              to={`/lesson/${nextLesson.id}`}
              className="card block p-4 sm:p-5 sm:text-left"
            >
              <span className="block text-sm text-stone-600 dark:text-stone-400">التالي</span>
              <span className="block mt-1 font-semibold text-stone-900 dark:text-stone-100">{nextLesson.title}</span>
            </Link>
          )}
        </nav>
      )}

      {seriesLessons.length > 1 && (
        <section aria-labelledby="series-lessons-heading" data-reveal className="space-y-3 sm:space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="series-lessons-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
              دروس {series.title}
            </h2>
            <span className="text-sm text-stone-600 dark:text-stone-400">
              {formatArabicCount(seriesLessons.length, COUNT_FORMS.lesson)}
            </span>
          </div>
          <ol className="card p-2 sm:p-3">
            {seriesLessons.map((item) => {
              const isCurrent = item.id === lesson.id;
              return (
                <li key={item.id}>
                  <Link
                    to={`/lesson/${item.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`flex items-baseline gap-3 sm:gap-4 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="w-8 shrink-0 text-stone-500 dark:text-stone-400 tabular-nums">
                      {new Intl.NumberFormat('ar-EG').format(item.lesson_number)}
                    </span>
                    <span className="flex-1 min-w-0">{item.title}</span>
                    {watchedIds.has(item.id) && (
                      <Check className="w-4 h-4 shrink-0 self-center text-emerald-700 dark:text-emerald-400" aria-label="تمّت متابعته" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      <ReportLink />
    </article>
  );
};
