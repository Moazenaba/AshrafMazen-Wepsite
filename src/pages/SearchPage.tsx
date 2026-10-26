import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Calendar, Video, Headphones, FileText, ArrowLeft, X, Sparkles } from 'lucide-react';
import { searchLessons, getLatestLessons, getCategories } from '../services/dataService';
import { formatArabicDate, getArabicLessonOrdinal, getCategoryColorTheme } from '../utils/helpers';
import type { Lesson, Series, Category } from '../types';

interface SearchResultLesson extends Lesson {
  series?: Series | null;
}

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultLesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'audio' | 'transcript'>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  useEffect(() => {
    let isMounted = true;
    async function executeSearch() {
      const trimmed = query.trim();
      if (!trimmed) {
        setLoading(true);
        try {
          // If query is empty, show latest lessons as recommendations
          const latest = await getLatestLessons(12);
          if (isMounted) {
            setResults(latest);
            setHasSearched(false);
          }
        } catch (err) {
          console.error('Failed to load recommended lessons:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchLessons(trimmed);
        if (isMounted) {
          setResults(res);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      executeSearch();
      if (query.trim()) {
        setSearchParams({ q: query.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [query, setSearchParams]);

  const filteredResults = results.filter((item) => {
    if (mediaFilter === 'video') return Boolean(item.youtube_url);
    if (mediaFilter === 'audio') return Boolean(item.audio_url);
    if (mediaFilter === 'transcript') return Boolean(item.transcript);
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
          البحث في المكتبة العلمية
        </h1>
        <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
          ابحث في عناوين الشروحات، متون الكتب، وتفريغات الدروس المكتوبة
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="اكتب كلمة البحث، اسم الباب، أو السلسلة..."
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 focus:border-transparent text-stone-800 dark:text-stone-100 placeholder-stone-400 shadow-sm text-base transition-all"
          autoFocus
        />
        <Search className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2"
            title="مسح البحث"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMediaFilter('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            mediaFilter === 'all'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-700'
          }`}
        >
          جميع الوسائط
        </button>
        <button
          type="button"
          onClick={() => setMediaFilter('video')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            mediaFilter === 'video'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-700'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>مرئي (فيديو)</span>
        </button>
        <button
          type="button"
          onClick={() => setMediaFilter('audio')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            mediaFilter === 'audio'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-700'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>مسموع (صوت)</span>
        </button>
        <button
          type="button"
          onClick={() => setMediaFilter('transcript')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            mediaFilter === 'transcript'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>تفريغ مكتوب</span>
        </button>
      </div>

      {/* Results Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 pb-2">
          <span>
            {hasSearched
              ? `نتائج البحث عن "${query}" (${filteredResults.length})`
              : `اقتراحات من أحدث الدروس (${filteredResults.length})`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
            <p className="font-amiri text-xl font-bold text-stone-700 dark:text-stone-300">
              لا توجد نتائج مطابقة.
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              جرب البحث بكلمات أخرى أو اختر وسائط مختلفة.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((item) => {
              const cat = item.series ? catMap.get(item.series.category_id) : null;
              const catTheme = getCategoryColorTheme(cat?.color);

              return (
                <Link
                  key={item.id}
                  to={`/lesson/${item.id}`}
                  className={`group p-5 rounded-2xl ${catTheme.cardBg} border ${catTheme.cardBorder} shadow-xs hover:shadow transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-semibold px-2.5 py-0.5 rounded-md border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                        {item.series?.title || 'سلسلة علمية'}
                      </span>
                      <span className="text-stone-400 font-amiri">
                        {getArabicLessonOrdinal(item.lesson_number)}
                      </span>
                      {item.published_at && (
                        <span className="text-stone-400 font-cairo flex items-center gap-1">
                          • {formatArabicDate(item.published_at)}
                        </span>
                      )}
                    </div>

                  <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-1 text-xs">
                    {item.youtube_url && (
                      <span className="p-1.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                        <Video className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.audio_url && (
                      <span className="p-1.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        <Headphones className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.transcript && (
                      <span className="p-1.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-emerald-800 dark:text-amber-400 flex items-center gap-1">
                    <span>فتح الدرس</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
