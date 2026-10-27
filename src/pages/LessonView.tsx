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
  Bookmark,
  Eye,
  BookOpen,
  Play,
} from 'lucide-react';
import {
  getLesson,
  getSeries,
  getCategory,
  getLessonsBySeries,
  incrementLessonViews,
} from '../services/dataService';
import {
  getArabicLessonOrdinal,
  getYouTubeEmbedUrl,
  formatArabicDate,
  formatArabicViews,
  getCategoryColorTheme,
} from '../utils/helpers';
import { AudioPlayer } from '../components/AudioPlayer';
import { PortalPanel } from '../components/PortalPanel';
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

  const handleCopyTranscript = () => {
    if (!lesson?.transcript) return;
    navigator.clipboard.writeText(lesson.transcript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${lesson?.title} - الشيخ أشرف مازن`,
        text: `درس ${lesson?.title} من ${series?.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-6 w-64 bg-stone-200 dark:bg-[#151f1a] rounded animate-pulse" />
        <div className="h-32 bg-stone-200 dark:bg-[#151f1a] rounded-2xl animate-pulse" />
        <div className="aspect-video bg-stone-200 dark:bg-[#151f1a] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!lesson || !series) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="p-12 rounded-3xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] shadow-sm space-y-4">
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
  const nextLesson =
    currentIndex !== -1 && currentIndex < seriesLessons.length - 1
      ? seriesLessons[currentIndex + 1]
      : null;

  const embedUrl = getYouTubeEmbedUrl(lesson.youtube_url);
  const catTheme = getCategoryColorTheme(category?.color);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
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
        <span className="text-emerald-800 dark:text-amber-400 font-semibold truncate max-w-[180px] sm:max-w-none">
          {lesson.title}
        </span>
      </nav>

      {/* Colored Header Banner with Islamic Portal Style */}
      <div className="rounded-2xl overflow-hidden border border-stone-200/90 dark:border-[#22302a] shadow-sm">
        <div
          className={`${catTheme.headerBg} p-5 sm:p-7 relative text-white border-b-4 border-amber-400`}
        >
          {/* Subtle Arabesque Pattern */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none select-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)`,
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg font-amiri font-bold text-xs sm:text-sm bg-white/20 text-white border border-white/20">
                  {getArabicLessonOrdinal(lesson.lesson_number)}
                </span>
                {category && (
                  <Link
                    to={`/category/${category.slug}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/25 text-amber-200 border border-amber-400/40 hover:bg-amber-400/40 transition-colors"
                  >
                    <span>{category.name}</span>
                  </Link>
                )}
                <Link
                  to={`/series/${series.slug}`}
                  className="text-xs font-semibold text-white/90 hover:text-amber-300 transition-colors"
                >
                  من سلسلة: {series.title}
                </Link>
              </div>

              {/* Views, Date, Bookmark, Share */}
              <div className="flex items-center gap-3">
                {typeof lesson.views === 'number' && (
                  <span className="flex items-center gap-1 text-xs text-amber-300 font-cairo">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{formatArabicViews(lesson.views)} مشاهدة</span>
                  </span>
                )}
                {lesson.published_at && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-white/80 font-cairo">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatArabicDate(lesson.published_at)}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleBookmark(lesson.id)}
                  title={bookmarked ? 'إزالة الدرس من المحفوظات' : 'حفظ الدرس في المفضلة'}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                    bookmarked
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-stone-950' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  title="مشاركة الدرس"
                  className="p-1.5 sm:p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="font-amiri text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-xs leading-snug">
              {lesson.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid: Player Column (8 cols) + Series Lessons Side List (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs Switcher: فيديو / استماع / قراءة */}
          <div className="p-1 bg-stone-200/60 dark:bg-[#1a261f] rounded-2xl flex items-center gap-1">
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
              <span>فيديو مرئي</span>
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
              <span>استماع صوتي</span>
              {lesson.audio_url && <span className="w-2 h-2 rounded-full bg-blue-400" />}
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
              <span>تفريغ مكتوب</span>
              {lesson.transcript && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          </div>

          {/* Tab 1: Video */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              {embedUrl ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-stone-900 border border-stone-200 dark:border-[#22302a]">
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] space-y-3">
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

          {/* Tab 2: Audio */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <AudioPlayer src={lesson.audio_url} title={lesson.title} />
            </div>
          )}

          {/* Tab 3: Transcript */}
          {activeTab === 'transcript' && (
            <div className="bg-white dark:bg-[#151f1a] rounded-2xl p-6 sm:p-10 border border-stone-200 dark:border-[#22302a] shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-[#22302a] text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
                  <span>التفريغ النصي المكتوب</span>
                </span>

                <div className="flex items-center gap-3">
                  {/* Font Sizing Controls */}
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1a261f] p-1 rounded-xl">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#22302a] hover:bg-stone-100 dark:hover:bg-[#1a261f] text-stone-700 dark:text-stone-300 transition-colors"
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

              {lesson.transcript ? (
                <div
                  className="font-amiri text-stone-800 dark:text-[#e8efe9] leading-[2.4] whitespace-pre-wrap selection:bg-emerald-100 dark:selection:bg-emerald-950/80 p-4 sm:p-6 rounded-xl bg-stone-50/50 dark:bg-[#1a261f]/40 border border-stone-100 dark:border-[#22302a]"
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

          {/* Next / Previous Lesson Bar */}
          <div className="pt-6 border-t border-stone-200 dark:border-[#22302a]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevLesson ? (
                <Link
                  to={`/lesson/${prevLesson.id}`}
                  className="group p-4 rounded-xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] hover:border-emerald-700 dark:hover:border-amber-500 transition-all shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-stone-100 dark:bg-[#1a261f] text-stone-600 dark:text-stone-300 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 block">
                        الدرس السابق ({getArabicLessonOrdinal(prevLesson.lesson_number)})
                      </span>
                      <span className="font-amiri text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 line-clamp-1 transition-colors">
                        {prevLesson.title}
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-[#22302a] text-stone-400 text-center flex items-center justify-center text-xs">
                  هذا هو الدرس الأول في السلسلة
                </div>
              )}

              {nextLesson ? (
                <Link
                  to={`/lesson/${nextLesson.id}`}
                  className="group p-4 rounded-xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] hover:border-emerald-700 dark:hover:border-amber-500 transition-all shadow-xs flex items-center justify-between text-left"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 block">
                      الدرس القادم ({getArabicLessonOrdinal(nextLesson.lesson_number)})
                    </span>
                    <span className="font-amiri text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 line-clamp-1 transition-colors">
                      {nextLesson.title}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-100 dark:bg-[#1a261f] text-stone-600 dark:text-stone-300 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                </Link>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-[#22302a] text-stone-400 text-center flex items-center justify-center text-xs">
                  هذا هو الدرس الأخير حتى الآن في السلسلة
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Column: "دروس السلسلة" Panel */}
        <div className="lg:col-span-4 space-y-6">
          <PortalPanel
            title={`دروس السلسلة (${seriesLessons.length})`}
            icon={<Layers className="w-4 h-4" />}
            headerBg={catTheme.headerBg}
            actionLink={`/series/${series.slug}`}
            actionText="كامل السلسلة"
          >
            <div className="max-h-[600px] overflow-y-auto divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1 pr-1">
              {seriesLessons.map((item) => {
                const isCurrent = item.id === lesson.id;
                return (
                  <Link
                    key={item.id}
                    to={`/lesson/${item.id}`}
                    className={`flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors group gap-2 ${
                      isCurrent
                        ? 'bg-amber-400/15 border-r-4 border-amber-500 font-bold'
                        : 'hover:bg-stone-50 dark:hover:bg-[#1a261f]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isCurrent ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                          <Play className="w-2.5 h-2.5 fill-stone-950" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded bg-stone-100 dark:bg-[#1a261f] text-stone-500 text-[11px] font-mono flex items-center justify-center shrink-0">
                          {item.lesson_number}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h4
                          className={`font-amiri text-sm truncate ${
                            isCurrent
                              ? 'text-emerald-900 dark:text-amber-300 font-bold'
                              : 'text-stone-800 dark:text-stone-200 group-hover:text-emerald-800 dark:group-hover:text-amber-300'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-cairo">
                          <span>{getArabicLessonOrdinal(item.lesson_number)}</span>
                          {typeof item.views === 'number' && (
                            <span>• {formatArabicViews(item.views)} مشاهدة</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-xs">
                      {item.youtube_url && (
                        <Video className="w-3.5 h-3.5 text-stone-400" />
                      )}
                      {item.audio_url && (
                        <Headphones className="w-3.5 h-3.5 text-stone-400" />
                      )}
                      {item.transcript && (
                        <FileText className="w-3.5 h-3.5 text-stone-400" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </PortalPanel>

          {/* Quick link to return to category */}
          {category && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  قسم: {category.name}
                </span>
              </div>
              <Link
                to={`/category/${category.slug}`}
                className="text-emerald-800 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>تصفح القسم</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
