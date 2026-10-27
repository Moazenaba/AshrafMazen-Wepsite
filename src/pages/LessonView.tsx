import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Video,
  Headphones,
  FileText,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Layers,
  Share2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { getLesson, getSeries, getCategory, getLessonsBySeries } from '../services/dataService';
import { getArabicLessonOrdinal, getYouTubeEmbedUrl, formatArabicDate, getCategoryColorTheme } from '../utils/helpers';
import { AudioPlayer } from '../components/AudioPlayer';
import { useBookmarks } from '../services/bookmarkService';
import type { Lesson, Series, Category } from '../types';

type TabType = 'video' | 'audio' | 'transcript';

export const LessonView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [seriesLessons, setSeriesLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [fontSize, setFontSize] = useState<number>(18);
  const [isCopied, setIsCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = lesson ? isBookmarked(lesson.id) : false;

  useEffect(() => {
    let isMounted = true;
    async function loadLessonData() {
      if (!id) return;
      try {
        setLoading(true);
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

          // Default tab logic: if no video but has audio, switch to audio; if only transcript, switch to transcript
          if (!l.youtube_url && l.audio_url) {
            setActiveTab('audio');
          } else if (!l.youtube_url && !l.audio_url && l.transcript) {
            setActiveTab('transcript');
          } else {
            setActiveTab('video');
          }
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLessonData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-6 w-64 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
        <div className="h-14 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
        <div className="aspect-video bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!lesson || !series) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h2 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">
            الدرس غير متاح
          </h2>
          <p className="text-stone-500 dark:text-stone-400">
            عذراً، هذا الدرس غير موجود أو أنه لم يُنشر بعد للعموم.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-sm"
          >
            <span>العودة للرئيسية</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Find previous and next published lessons in this series
  const currentIndex = seriesLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? seriesLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < seriesLessons.length - 1 ? seriesLessons[currentIndex + 1] : null;

  const embedUrl = getYouTubeEmbedUrl(lesson.youtube_url);

  const handleCopyTranscript = () => {
    if (!lesson.transcript) return;
    navigator.clipboard.writeText(lesson.transcript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${lesson.title} - الشيخ أشرف مازن`,
        text: `درس ${lesson.title} من ${series.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Share Toast Notification */}
      {isShareCopied && (
        <div className="fixed top-20 right-1/2 translate-x-1/2 z-50 bg-stone-900 text-stone-100 dark:bg-amber-400 dark:text-stone-950 px-5 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-stone-950" />
          <span>تم نسخ رابط الدرس إلى الحافظة بنجاح</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs text-stone-500 dark:text-stone-400">
        <Link to="/" className="hover:text-emerald-700 dark:hover:text-amber-300">
          الرئيسية
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        {category && (
          <>
            <Link
              to={`/category/${category.slug}`}
              className="hover:text-emerald-700 dark:hover:text-amber-300"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </>
        )}
        <Link
          to={`/series/${series.slug}`}
          className="hover:text-emerald-700 dark:hover:text-amber-300"
        >
          {series.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-emerald-800 dark:text-amber-400 font-semibold truncate max-w-[160px] sm:max-w-none">
          {lesson.title}
        </span>
      </nav>

      {/* Lesson Header Title Area */}
      <div className="space-y-3 border-b border-stone-200 dark:border-stone-800 pb-5 sm:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            {(() => {
              const catTheme = getCategoryColorTheme(category?.color);
              return (
                <>
                  <span className={`px-2.5 py-1 rounded-lg font-amiri font-bold text-xs sm:text-sm border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                    {getArabicLessonOrdinal(lesson.lesson_number)}
                  </span>
                  {category && (
                    <Link
                      to={`/category/${category.slug}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${catTheme.dot}`} />
                      <span>{category.name}</span>
                    </Link>
                  )}
                </>
              );
            })()}
            <Link
              to={`/series/${series.slug}`}
              className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-amber-400 hover:underline"
            >
              من {series.title}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {lesson.published_at && (
              <span className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1 font-cairo">
                <Calendar className="w-3.5 h-3.5" />
                {formatArabicDate(lesson.published_at)}
              </span>
            )}
            <button
              type="button"
              onClick={() => lesson && toggleBookmark(lesson.id)}
              title={bookmarked ? 'إزالة الدرس من المحفوظات' : 'حفظ الدرس في المفضلة'}
              aria-label={bookmarked ? 'إزالة الدرس من المحفوظات' : 'حفظ الدرس في المفضلة'}
              className={`p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl transition-all ${
                bookmarked
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60'
                  : 'text-stone-500 hover:text-emerald-800 dark:hover:text-amber-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-600 dark:text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="مشاركة الدرس"
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-stone-500 hover:text-emerald-800 dark:hover:text-amber-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h1 className="font-amiri text-2xl sm:text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 leading-snug sm:leading-snug">
          {lesson.title}
        </h1>
      </div>

      {/* Tabs Switcher: فيديو / استماع / قراءة (Segmented Control on Mobile) */}
      <div className="p-1 bg-stone-200/60 dark:bg-stone-800/60 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
            activeTab === 'video'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-300/50 dark:hover:bg-stone-700/50'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>فيديو</span>
          {lesson.youtube_url && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
            activeTab === 'audio'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-300/50 dark:hover:bg-stone-700/50'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>استماع</span>
          {lesson.audio_url && (
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
            activeTab === 'transcript'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-300/50 dark:hover:bg-stone-700/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>قراءة</span>
          {lesson.transcript && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Tab 1: Video (YouTube Player) */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          {embedUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-stone-900 border border-stone-200 dark:border-stone-800">
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
              <Video className="w-12 h-12 text-stone-400 mx-auto" />
              <h4 className="font-amiri text-xl font-bold text-stone-700 dark:text-stone-300">
                التسجيل المرئي غير متوفر لهذا الدرس حالياً
              </h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                يمكنك الاستماع للتسجيل الصوتي أو مطالعة التفريغ المكتوب من التبويبات أعلاه.
              </p>
              {lesson.audio_url && (
                <button
                  type="button"
                  onClick={() => setActiveTab('audio')}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-800 text-white"
                >
                  الانتقال للاستماع الصوتي
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Audio Player */}
      {activeTab === 'audio' && (
        <div className="space-y-6">
          <AudioPlayer src={lesson.audio_url} title={lesson.title} />
        </div>
      )}

      {/* Tab 3: Transcript Reading */}
      {activeTab === 'transcript' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-10 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          {/* Transcript Top Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800 text-xs">
            <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span>التفريغ النصي المكتوب</span>
            </span>

            <div className="flex items-center gap-3">
              {/* Font Sizing Controls */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFontSize((prev) => Math.max(prev - 2, 14))}
                  title="تصغير الخط"
                  className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize(18)}
                  title="إعادة ضبط حجم الخط الافتراضي"
                  className="px-2 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"
                >
                  {fontSize}px
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize((prev) => Math.min(prev + 2, 28))}
                  title="تكبير الخط"
                  className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Copy Transcript Button */}
              {lesson.transcript && (
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ النص</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Transcript Content */}
          {lesson.transcript ? (
            <div
              className="font-amiri text-stone-800 dark:text-[#e8efe9] leading-[2.3] whitespace-pre-wrap selection:bg-emerald-100 dark:selection:bg-emerald-950/80 p-4 sm:p-6 rounded-2xl bg-stone-50/50 dark:bg-[#1a261f]/40 border border-stone-100 dark:border-[#22302a]"
              style={{ fontSize: `${fontSize}px` }}
            >
              {lesson.transcript}
            </div>
          ) : (
            <div className="p-10 text-center text-stone-500 dark:text-stone-400 font-cairo">
              لا يتوفر تفريغ مكتوب لهذا الدرس بعد.
            </div>
          )}
        </div>
      )}

      {/* Previous / Next Lesson Navigation within the series */}
      <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Previous Lesson (Right side in RTL) */}
          {prevLesson ? (
            <Link
              to={`/lesson/${prevLesson.id}`}
              className="group p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-700 dark:hover:border-amber-500 transition-all shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 block">
                    الدرس السابق ({getArabicLessonOrdinal(prevLesson.lesson_number)})
                  </span>
                  <span className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 line-clamp-1 transition-colors">
                    {prevLesson.title}
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800/60 text-stone-400 text-center flex items-center justify-center text-xs">
              هذا هو الدرس الأول في السلسلة
            </div>
          )}

          {/* Next Lesson (Left side in RTL) */}
          {nextLesson ? (
            <Link
              to={`/lesson/${nextLesson.id}`}
              className="group p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-700 dark:hover:border-amber-500 transition-all shadow-sm flex items-center justify-between text-left"
            >
              <div>
                <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 block">
                  الدرس القادم ({getArabicLessonOrdinal(nextLesson.lesson_number)})
                </span>
                <span className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 line-clamp-1 transition-colors">
                  {nextLesson.title}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
            </Link>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800/60 text-stone-400 text-center flex items-center justify-center text-xs">
              هذا هو الدرس الأخير حتى الآن في السلسلة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
