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
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { getBookmarkedLessons } from '../services/dataService';
import { useBookmarks } from '../services/bookmarkService';
import { formatArabicDate, getArabicLessonOrdinal, getCategoryColorTheme } from '../utils/helpers';
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

  // Filter lessons by text query and media format
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
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

      {/* Header Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>المكتبة الشخصية</span>
          </div>

          <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <span>الدروس المحفوظة</span>
            {count > 0 && (
              <span className="font-mono text-base sm:text-lg font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {count} {count === 1 ? 'درس' : 'دروس'}
              </span>
            )}
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-cairo leading-relaxed">
            جميع المواد والشروحات التي قمت بحفظها للرجوع إليها في أي وقت. يتم حفظ هذه القائمة في متصفحك محلياً لسهولة المتابعة والاستفادة.
          </p>
        </div>

        {/* Header Actions */}
        {count > 0 && (
          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-950/60 text-xs font-semibold transition-all focus:outline-none"
            >
              <Trash2 className="w-4 h-4" />
              <span>إفراغ المحفوظات</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing All Bookmarks */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-200 dark:border-red-800/60">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                تأكيد إفراغ المحفوظات
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-cairo leading-relaxed">
                هل أنت متأكد من رغبتك في حذف جميع الدروس المحفوظة ({count} درس)؟ لن تتمكن من استرجاعها إلا بإعادة إضافتها مجدداً.
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

      {/* Filter and Search within Bookmarks (Visible if count >= 2) */}
      {count >= 2 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ابحث في الدروس المحفوظة باسم الدرس أو السلسلة..."
              className="w-full px-4 py-2 pr-10 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Format Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                formatFilter === 'all'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              الكل ({lessons.length})
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter('video')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                formatFilter === 'video'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>مرئي</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter('audio')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                formatFilter === 'audio'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>صوت</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatFilter('transcript')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                formatFilter === 'transcript'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>مكتوب</span>
            </button>
          </div>
        </div>
      )}

      {/* Bookmarks Grid / States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-stone-200 dark:bg-stone-800/80 animate-pulse border border-stone-200 dark:border-stone-800"
            />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        /* Empty State: No bookmarks yet */
        <div className="p-12 sm:p-16 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-5 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/50">
            <Bookmark className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-amiri text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              لا توجد دروس محفوظة بعد
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 font-cairo leading-relaxed max-w-md mx-auto">
              يمكنك حفظ أي درس علمي بنقرة واحدة عبر رمز العلامة المرجعية <Bookmark className="w-4 h-4 inline-block text-amber-500 mx-1" /> أعلى صفحة الدرس، لتجده محفوظاً هنا دائماً.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>استكشف مكتبة الدروس والسلاسل</span>
            </Link>
          </div>
        </div>
      ) : filteredLessons.length === 0 ? (
        /* Empty filter result */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <BookmarkX className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-amiri text-xl font-bold text-stone-800 dark:text-stone-200">
            لا توجد نتائج مطابقة لبحثك في المحفوظات
          </h3>
          <p className="text-xs text-stone-500 font-cairo">
            جرب البحث بكلمات أخرى أو اختر تصفية وسائط مختلفة.
          </p>
        </div>
      ) : (
        /* Lessons Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => {
            const catTheme = getCategoryColorTheme(lesson.category?.color);

            return (
              <div
                key={lesson.id}
                className={`group relative p-6 rounded-2xl ${catTheme.cardBg} border ${catTheme.cardBorder} shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  {/* Top bar: Series badge + Ordinal + Unbookmark button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold px-2.5 py-1 rounded-lg border text-xs ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                        {lesson.series?.title || 'سلسلة علمية'}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400 text-xs font-amiri font-bold">
                        {getArabicLessonOrdinal(lesson.lesson_number)}
                      </span>
                    </div>

                    {/* Remove from bookmarks button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeBookmark(lesson.id);
                      }}
                      title="إزالة من المحفوظات"
                      className="p-1.5 rounded-lg text-amber-500 hover:text-red-600 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition-colors shrink-0"
                    >
                      <BookmarkCheck className="w-5 h-5 fill-amber-500" />
                    </button>
                  </div>

                  {/* Title */}
                  <Link to={`/lesson/${lesson.id}`} className="block group">
                    <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug mb-3">
                      {lesson.title}
                    </h3>
                  </Link>
                </div>

                {/* Footer: formats, date, and link */}
                <div className="pt-4 mt-2 border-t border-stone-200/50 dark:border-stone-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {lesson.youtube_url && (
                      <span
                        title="مرئي (يوتيوب)"
                        className="p-1 rounded-md bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {lesson.audio_url && (
                      <span
                        title="مسموع (صوت)"
                        className="p-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {lesson.transcript && (
                      <span
                        title="تفريغ مكتوب"
                        className="p-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/lesson/${lesson.id}`}
                    className="text-emerald-800 dark:text-amber-400 font-semibold flex items-center gap-1 hover:translate-x-[-3px] transition-transform"
                  >
                    <span>عرض ومتابعة</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
