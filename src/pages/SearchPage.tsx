import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  Video,
  Headphones,
  FileText,
  ArrowLeft,
  X,
  Eye,
  Filter,
} from 'lucide-react';
import { searchLessons, getLatestLessons, getCategories } from '../services/dataService';
import {
  formatArabicDate,
  formatArabicViews,
  getArabicLessonOrdinal,
  getCategoryColorTheme,
} from '../utils/helpers';
import { PublicSidebar } from '../components/PublicSidebar';
import type { Lesson, Series, Category } from '../types';

interface SearchResultLesson extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
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
      if (!trimmed && !categoryFilter) {
        setLoading(true);
        try {
          const latest = await getLatestLessons(16);
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
      const newParams = new URLSearchParams();
      if (query.trim()) newParams.set('q', query.trim());
      if (categoryFilter) newParams.set('category', categoryFilter);
      setSearchParams(newParams, { replace: true });
    }, 200);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [query, categoryFilter, setSearchParams]);

  const filteredResults = results.filter((item) => {
    if (categoryFilter) {
      const itemCatSlug = item.category?.slug;
      if (itemCatSlug && itemCatSlug !== categoryFilter) {
        return false;
      }
    }
    if (mediaFilter === 'video') return Boolean(item.youtube_url);
    if (mediaFilter === 'audio') return Boolean(item.audio_url);
    if (mediaFilter === 'transcript') return Boolean(item.transcript);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header Banner with Portal Style */}
      <div className="rounded-2xl overflow-hidden border border-stone-200/90 dark:border-[#22302a] shadow-sm">
        <div className="bg-emerald-900 dark:bg-[#12281d] p-6 sm:p-9 relative text-white border-b-4 border-amber-400">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none select-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)`,
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 space-y-3 text-center sm:text-right">
            <h1 className="font-amiri text-3xl sm:text-4xl font-bold text-white drop-shadow-xs">
              البحث في المكتبة العلمية
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-cairo max-w-2xl leading-relaxed">
              ابحث في عناوين الشروحات، متون الكتب، وتفريغات الدروس المكتوبة مع تصفية وسائط الاستماع والمشاهدة.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Results (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search Box & Category Selector */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] shadow-xs space-y-3">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب كلمة البحث، اسم الباب، أو السلسلة..."
                className="w-full pl-10 pr-11 py-3 rounded-lg bg-stone-50 dark:bg-[#1a261f] border border-stone-200 dark:border-[#22302a] focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm transition-all"
                autoFocus
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold">
              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-[#22302a] bg-stone-50 dark:bg-[#1a261f] text-stone-700 dark:text-stone-300 focus:outline-none text-xs"
              >
                <option value="">كافة العلوم الشرعية</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Media Format Filter Buttons */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1a261f] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMediaFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    mediaFilter === 'all'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter('video')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    mediaFilter === 'video'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>مرئي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter('audio')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    mediaFilter === 'audio'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <Headphones className="w-3 h-3" />
                  <span>صوت</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter('transcript')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    mediaFilter === 'transcript'
                      ? 'bg-white dark:bg-[#151f1a] text-emerald-800 dark:text-amber-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>تفريغ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-[#22302a] pb-2 font-cairo">
            <span>
              {hasSearched
                ? `نتائج البحث (${filteredResults.length})`
                : `أحدث الدروس المقترحة (${filteredResults.length})`}
            </span>
          </div>

          {/* Results List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-stone-200 dark:bg-[#151f1a] animate-pulse" />
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] space-y-2">
              <p className="font-amiri text-xl font-bold text-stone-700 dark:text-stone-300">
                لا توجد نتائج مطابقة لبحثك.
              </p>
              <p className="text-xs text-stone-500 font-cairo">
                جرب البحث بكلمات أخرى أو غير خيارات تصفية الأقسام والوسائط.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((item) => {
                const cat = item.series ? catMap.get(item.series.category_id) : item.category;
                const catTheme = getCategoryColorTheme(cat?.color);

                return (
                  <Link
                    key={item.id}
                    to={`/lesson/${item.id}`}
                    className={`group p-4 sm:p-5 rounded-xl ${catTheme.cardBg} border ${catTheme.cardBorder} hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-cairo">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}
                        >
                          {item.series?.title || 'سلسلة علمية'}
                        </span>
                        <span className="text-stone-400 font-amiri">
                          {getArabicLessonOrdinal(item.lesson_number)}
                        </span>
                        {item.published_at && (
                          <span className="text-stone-400">
                            • {formatArabicDate(item.published_at)}
                          </span>
                        )}
                        {typeof item.views === 'number' && (
                          <span className="text-stone-400 flex items-center gap-1">
                            • <Eye className="w-3 h-3" />
                            <span>{formatArabicViews(item.views)}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors truncate">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/50 dark:border-[#22302a]">
                      <div className="flex items-center gap-1 text-xs">
                        {item.youtube_url && (
                          <span className="p-1 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                            <Video className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {item.audio_url && (
                          <span className="p-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                            <Headphones className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {item.transcript && (
                          <span className="p-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-semibold text-emerald-800 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform font-cairo">
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

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <PublicSidebar />
        </div>
      </div>
    </div>
  );
};
