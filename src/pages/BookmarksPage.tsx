import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  BookmarkX,
  Trash2,
  Calendar,
  Video,
  Headphones,
  FileText,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Search,
  Eye,
} from 'lucide-react';
import { getBookmarkedLessons } from '../services/dataService';
import { useBookmarks } from '../services/bookmarkService';
import {
  formatArabicDate,
  formatArabicViews,
  getArabicLessonOrdinal,
  getCategoryColorTheme,
} from '../utils/helpers';
import { PublicSidebar } from '../components/PublicSidebar';
import type { Lesson, Series, Category } from '../types';

interface BookmarkedLessonItem extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

export const BookmarksPage: React.FC = () => {
  const { bookmarkedIds, removeBookmark, clearAllBookmarks, count } = useBookmarks();
  const [lessons, setLessons] = useState<BookmarkedLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'video' | 'audio' | 'transcript'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        if (bookmarkedIds.length === 0) {
          if (isMounted) {
            setLessons([]);
            setLoading(false);
          }
          return;
        }
        const data = await getBookmarkedLessons(bookmarkedIds);
        if (isMounted) {
          setLessons(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load bookmarked lessons:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [bookmarkedIds]);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      searchFilter.trim() === '' ||
      lesson.title.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
      lesson.series?.title.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
      lesson.category?.name.toLowerCase().includes(searchFilter.trim().toLowerCase());

    const matchesFormat =
      formatFilter === 'all' ||
      (formatFilter === 'video' && Boolean(lesson.youtube_url)) ||
      (formatFilter === 'audio' && Boolean(lesson.audio_url)) ||
      (formatFilter === 'transcript' && Boolean(lesson.transcript));

    return matchesSearch && matchesFormat;
  });

  const handleClearAll = () => {
    clearAllBookmarks();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
        <Link to="/" className="hover:text-emerald-700 dark:hover:text-amber-300">
          الرئيسية
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-emerald-800 dark:text-amber-400 font-semibold">
          الدروس المحفوظة
        </span>
      </nav>

      {/* Header Banner with Portal Style */}
      <div className="rounded-2xl overflow-hidden border border-stone-200/90 dark:border-[#22302a] shadow-sm">
        <div className="bg-emerald-900 dark:bg-[#12281d] p-6 sm:p-9 relative text-white border-b-4 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none select-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)`,
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-semibold font-cairo">
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>المكتبة الشخصية</span>
            </div>

            <h1 className="font-amiri text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <span>الدروس المحفوظة</span>
              {count > 0 && (
                <span className="font-mono text-sm sm:text-base font-bold px-3 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {count} {count === 1 ? 'درس' : 'دروس'}
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-200/90 font-cairo leading-relaxed">
              جميع المواد والشروحات التي قمت بحفظها للرجوع إليها في أي وقت. محفوظة محلياً في متصفحك.
            </p>
          </div>

          {count > 0 && (
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300/40 bg-red-950/40 text-red-200 hover:bg-red-900/60 text-xs font-semibold transition-all focus:outline-none"
              >
                <Trash2 className="w-4 h-4 text-red-300" />
                <span>إفراغ المحفوظات</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#151f1a] rounded-2xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-[#22302a] space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-200 dark:border-red-800/60">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                تأكيد إفراغ المحفوظات
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-cairo leading-relaxed">
                هل أنت متأكد من رغبتك في حذف جميع الدروس المحفوظة ({count} درس)؟
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                نعم، إفراغ الكل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Bookmarks (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filter Bar */}
          {count >= 2 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a]">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="ابحث في الدروس المحفوظة..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-stone-200 dark:border-[#22302a] bg-stone-50 dark:bg-[#1a261f] text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400"
                />
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1a261f] p-1 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFormatFilter('all')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    formatFilter === 'all'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  الكل ({lessons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('video')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                    formatFilter === 'video'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>مرئي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('audio')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                    formatFilter === 'audio'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>صوت</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter('transcript')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                    formatFilter === 'transcript'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>مكتوب</span>
                </button>
              </div>
            </div>
          )}

          {/* Bookmarks List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-stone-200 dark:bg-[#151f1a] animate-pulse" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/50">
                <Bookmark className="w-7 h-7" />
              </div>
              <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                لا توجد دروس محفوظة بعد
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-cairo max-w-sm mx-auto leading-relaxed">
                احفظ أي درس بنقرة واحدة عبر رمز العلامة المرجعية أعلى صفحة الدرس لتجده محفوظاً هنا دائماً.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تصفح مكتبة الدروس</span>
                </Link>
              </div>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] space-y-2">
              <BookmarkX className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="font-amiri text-xl font-bold text-stone-800 dark:text-stone-200">
                لا توجد نتائج مطابقة لبحثك في المحفوظات
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => {
                const catTheme = getCategoryColorTheme(lesson.category?.color);

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 sm:p-5 rounded-xl ${catTheme.cardBg} border ${catTheme.cardBorder} hover:shadow-md transition-all flex flex-col justify-between gap-3`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] font-cairo ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}
                          >
                            {lesson.series?.title || 'سلسلة علمية'}
                          </span>
                          <span className="text-stone-500 text-xs font-amiri font-bold">
                            {getArabicLessonOrdinal(lesson.lesson_number)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBookmark(lesson.id)}
                          title="إزالة من المحفوظات"
                          className="p-1.5 rounded-lg text-amber-500 hover:text-red-600 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-colors"
                        >
                          <BookmarkCheck className="w-4 h-4 fill-amber-500" />
                        </button>
                      </div>

                      <Link to={`/lesson/${lesson.id}`} className="block group">
                        <h3 className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors line-clamp-1 mb-1">
                          {lesson.title}
                        </h3>
                      </Link>
                    </div>

                    <div className="pt-3 border-t border-stone-200/50 dark:border-[#22302a] flex items-center justify-between text-xs font-cairo">
                      <div className="flex items-center gap-3 text-stone-400">
                        {typeof lesson.views === 'number' && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{formatArabicViews(lesson.views)}</span>
                          </span>
                        )}
                        {lesson.published_at && (
                          <span className="hidden sm:inline">
                            {formatArabicDate(lesson.published_at)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/lesson/${lesson.id}`}
                        className="text-emerald-800 dark:text-amber-400 font-semibold flex items-center gap-1 hover:translate-x-[-2px] transition-transform"
                      >
                        <span>متابعة الدرس</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <PublicSidebar />
        </div>
      </div>
    </div>
  );
};
