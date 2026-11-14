import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchLessons, getLatestLessons, getCategories } from '../services/dataService';
import { formatArabicDate, formatArabicCount, COUNT_FORMS } from '../utils/helpers';
import { LessonThumb } from '../components/LessonThumb';
import { MediaIcons } from '../components/MediaIcons';
import { SiteSearchExtras } from '../components/SiteSearchExtras';
import type { Lesson, Series, Category } from '../types';

type MediaFilter = 'all' | 'video' | 'audio' | 'transcript';

const MEDIA_FILTERS: { value: MediaFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'video', label: 'مرئي' },
  { value: 'audio', label: 'صوتي' },
  { value: 'transcript', label: 'مكتوب' },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Marks every word of the query inside a title (the search matches words, in any order)
function highlight(text: string, q: string): React.ReactNode {
  const words = q.trim().split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return text;
  const lower = new Set(words.map((w) => w.toLowerCase()));
  return text.split(new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi')).map((part, i) =>
    lower.has(part.toLowerCase()) ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-400/30 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

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
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
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
        // A category alone (no words) lists every published lesson, and the filter below keeps that category's
        const res = await searchLessons(trimmed, true);
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
      // A lesson without a category belongs to no category filter
      if (item.category?.slug !== categoryFilter) return false;
    }
    if (mediaFilter === 'video') return Boolean(item.youtube_url);
    if (mediaFilter === 'audio') return Boolean(item.audio_url);
    if (mediaFilter === 'transcript') return Boolean(item.transcript);
    return true;
  });

  const trimmedQuery = query.trim();
  const isFiltering = Boolean(trimmedQuery || categoryFilter);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <header data-reveal className="space-y-6">
        <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-emerald-950 dark:text-stone-100">البحث في الموقع</h1>

        <div role="search" className="space-y-4">
          <div className="relative">
            <label htmlFor="search-query" className="sr-only">
              كلمة البحث
            </label>
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="عنوان درس أو فيديو أو كتاب، أو كلمة منه..."
              className="w-full h-14 pr-12 pl-12 rounded-2xl bg-white dark:bg-stone-900 border border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-400 text-stone-900 dark:text-stone-100 placeholder-stone-500 text-base"
            />
            <Search className="w-5 h-5 text-stone-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="مسح البحث"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
              <span>القسم</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="">كل الأقسام</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div role="group" aria-label="نوع المحتوى" className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-900">
              {MEDIA_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={mediaFilter === f.value}
                  onClick={() => setMediaFilter(f.value)}
                  className={`h-11 px-4 rounded-lg text-sm font-semibold transition-colors ${
                    mediaFilter === f.value
                      ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-300'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="results-heading" aria-busy={loading} className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="results-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
            {isFiltering || hasSearched ? 'النتائج' : 'أحدث الدروس'}
          </h2>
          {!loading && (
            <span aria-live="polite" className="text-sm text-stone-600 dark:text-stone-400">
              {formatArabicCount(filteredResults.length, COUNT_FORMS.lesson)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-stone-100 dark:bg-stone-900" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="space-y-2 py-6">
            <p className="text-lg text-stone-800 dark:text-stone-200">
              {trimmedQuery && results.length === 0
                ? `لا توجد دروس مرفوعة على الموقع تطابق «${trimmedQuery}».`
                : 'لا توجد دروس بهذه التصفية.'}
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              {trimmedQuery ? 'ما وُجد في فيديوهات القناة والمكتبة يظهر أسفل هذا. ' : ''}جرّب كلمة أقصر، أو اختر «كل الأقسام» و«الكل».
            </p>
          </div>
        ) : (
          <ul className="card p-2 sm:p-3">
            {filteredResults.map((lesson, i) => {
              const category = lesson.category || (lesson.series ? catMap.get(lesson.series.category_id) : null);
              return (
                <li key={lesson.id} data-reveal style={{ '--reveal-delay': `${Math.min(i, 6) * 50}ms` } as React.CSSProperties}>
                  <Link
                    to={`/lesson/${lesson.id}`}
                    className="group flex items-center gap-4 sm:gap-6 px-4 py-4 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} imageUrl={lesson.image} className="w-28 sm:w-40 shrink-0" />
                    <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <span className="block text-lg font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                        {highlight(lesson.title, trimmedQuery)}
                      </span>
                      <span className="block text-sm text-stone-600 dark:text-stone-400">
                        {[category?.name, lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
                      </span>
                      <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* The channel's videos (in the chosen category, or found by the words) and the library's books */}
      {(mediaFilter === 'all' || mediaFilter === 'video') && (
        <SiteSearchExtras
          query={trimmedQuery}
          highlight={highlight}
          showBooks={mediaFilter === 'all' && !categoryFilter}
          categorySlug={mediaFilter === 'all' || mediaFilter === 'video' ? categoryFilter : ''}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        />
      )}
    </div>
  );
};
