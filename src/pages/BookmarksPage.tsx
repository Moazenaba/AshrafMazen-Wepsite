import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { getBookmarkedLessons } from '../services/dataService';
import { useBookmarks } from '../services/bookmarkService';
import { formatArabicDate, formatArabicCount, COUNT_FORMS } from '../utils/helpers';
import { LessonThumb } from '../components/LessonThumb';
import { MediaIcons } from '../components/MediaIcons';
import { SavedExtras } from '../components/SavedExtras';
import type { Lesson, Series, Category } from '../types';

interface BookmarkedLessonItem extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

// A filter box only earns its place once the list is long enough to need it
const FILTER_THRESHOLD = 6;

export const BookmarksPage: React.FC = () => {
  const { bookmarkedIds, removeBookmark, clearAllBookmarks } = useBookmarks();
  // Lessons are saved by their id; channel videos as "yt:<id>" and books as "book:<id>"
  const isExtra = (id: string) => id.startsWith('yt:') || id.startsWith('book:');
  const lessonIds = bookmarkedIds.filter((id) => !isExtra(id));
  const extraIds = bookmarkedIds.filter(isExtra);
  const [lessons, setLessons] = useState<BookmarkedLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        if (lessonIds.length === 0) {
          if (isMounted) {
            setLessons([]);
            setLoading(false);
          }
          return;
        }
        const data = await getBookmarkedLessons(lessonIds);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonIds.join(',')]);

  const needle = searchFilter.trim().toLowerCase();
  const filteredLessons = needle
    ? lessons.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(needle) ||
          lesson.series?.title.toLowerCase().includes(needle) ||
          lesson.category?.name.toLowerCase().includes(needle)
      )
    : lessons;

  const handleClearAll = () => {
    const confirmed = window.confirm(
      `حذف كل المحفوظات (${new Intl.NumberFormat('ar-EG').format(bookmarkedIds.length)})؟ لا يمكن التراجع عن ذلك.`
    );
    if (confirmed) clearAllBookmarks();
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <header data-reveal className="space-y-3">
        <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-emerald-950 dark:text-stone-100">المحفوظات</h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-2xl">
          ما حفظته من دروس وفيديوهات وكتب يبقى في هذا المتصفح فقط، ولا تحتاج إلى حساب.
        </p>
      </header>

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-100 dark:bg-stone-900" />
          ))}
        </div>
      ) : lessons.length === 0 && extraIds.length === 0 ? (
        <section className="space-y-3 py-6">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">لم تحفظ شيئاً بعد</h2>
          <p className="text-stone-600 dark:text-stone-400">
            اضغط «حفظ» في صفحة أي درس أو فيديو أو كتاب ليظهر هنا، فتعود إليه متى شئت.
          </p>
          <Link
            to={{ pathname: '/', hash: '#latest' }}
            className="inline-flex items-center min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
          >
            تصفح أحدث الدروس
          </Link>
        </section>
      ) : (
        <>
        {lessons.length > 0 && (
        <section aria-labelledby="saved-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="saved-heading" className="text-stone-600 dark:text-stone-400">
              {formatArabicCount(lessons.length, COUNT_FORMS.lesson)}
            </h2>
            <button
              type="button"
              onClick={handleClearAll}
              className="h-11 px-3 text-sm font-semibold text-red-700 dark:text-red-400 hover:underline"
            >
              إفراغ المحفوظات
            </button>
          </div>

          {lessons.length >= FILTER_THRESHOLD && (
            <div>
              <label htmlFor="bookmarks-filter" className="sr-only">
                ابحث في المحفوظات
              </label>
              <input
                id="bookmarks-filter"
                type="search"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="ابحث في المحفوظات..."
                className="w-full h-12 px-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-400 text-stone-900 dark:text-stone-100 placeholder-stone-500"
              />
            </div>
          )}

          {filteredLessons.length === 0 ? (
            <p className="py-6 text-stone-600 dark:text-stone-400">لا توجد دروس محفوظة تطابق «{searchFilter.trim()}».</p>
          ) : (
            <ul className="card p-2 sm:p-3">
              {filteredLessons.map((lesson) => (
                <li key={lesson.id} className="flex items-center gap-1">
                  <Link
                    to={`/lesson/${lesson.id}`}
                    className="group flex-1 min-w-0 flex items-center gap-4 sm:gap-6 px-4 py-4 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} className="w-28 sm:w-40 shrink-0" />
                    <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <span className="block text-lg font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                        {lesson.title}
                      </span>
                      <span className="block text-sm text-stone-600 dark:text-stone-400">
                        {[lesson.category?.name, lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
                      </span>
                      <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeBookmark(lesson.id)}
                    aria-label={`إزالة «${lesson.title}» من المحفوظات`}
                    title="إزالة من المحفوظات"
                    className="w-11 h-11 shrink-0 ml-2 flex items-center justify-center rounded-lg text-stone-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
        <SavedExtras ids={extraIds} onRemove={removeBookmark} />
        </>
      )}
    </div>
  );
};
