import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LessonThumb } from './LessonThumb';
import { MediaIcons } from './MediaIcons';

// One thing that was just published: a lesson on the site, or a video from a channel playlist
export interface LatestItem {
  id: string;
  title: string;
  href: string;
  meta: string;
  category: string;
  date: string;
  youtubeUrl?: string | null;
  audioUrl?: string | null;
  transcript?: string | null;
}

export interface LatestCategory {
  value: string;
  label: string;
}

// The section shows at most this many items, so the page keeps room for the sciences and the rest
const MAX_SHOWN = 3;
const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// The newest items, with a search box for the title and a filter for the category. At most three are shown.
// Placeholder rows while the list loads: same size as the real rows, so the page doesn't jump
// Same rows as the LatestSearch list
const LatestRowsSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <ul aria-hidden="true" className="space-y-2 text-stone-500">
    {Array.from({ length: rows }, (_, i) => (
      <li key={i} className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg bg-stone-50 dark:bg-stone-900">
        <span className="block aspect-video w-20 sm:w-32 shrink-0 rounded-xl bg-stone-200 dark:bg-stone-700" />
        <span className="min-w-0 flex-1 space-y-2 pt-1">
          <span className="block rounded bg-current opacity-15 motion-safe:animate-pulse h-4 w-11/12" />
          <span className="block rounded bg-current opacity-15 motion-safe:animate-pulse h-4 w-3/5" />
          <span className="block rounded bg-current opacity-15 motion-safe:animate-pulse h-3 w-2/5" />
        </span>
      </li>
    ))}
  </ul>
);

export const LatestSearch: React.FC<{ items: LatestItem[]; categories: LatestCategory[]; loading?: boolean; className?: string }> = ({
  items,
  categories,
  loading = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!category || item.category === category) &&
        (!needle || item.title.toLowerCase().includes(needle) || item.meta.toLowerCase().includes(needle))
    );
  }, [items, query, category]);

  const visible = filtered.slice(0, MAX_SHOWN);

  return (
    <section data-reveal id="latest" aria-labelledby="latest-search-heading" className={`rounded-xl bg-white dark:bg-stone-800 overflow-hidden ${className}`}>
      <h2 id="latest-search-heading" className="px-4 py-2.5 sm:px-5 sm:py-3 bg-mushaf text-gold-soft font-ruqaa text-xl sm:text-2xl border-b-2 border-gold">
        آخر ما نزل
      </h2>

      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-[minmax(0,1fr)_112px] gap-2 sm:grid-cols-[minmax(0,1fr)_240px] sm:gap-3">
          <label htmlFor="latest-query" className="sr-only">
            ابحث في آخر ما نزل
          </label>
          <input
            id="latest-query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بعنوان الدرس أو الموضوع..."
            className="h-11 sm:h-12 px-3 sm:px-4 rounded-lg bg-stone-50 dark:bg-stone-900 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-mushaf"
          />
          <label htmlFor="latest-category" className="sr-only">
            القسم
          </label>
          <select
            id="latest-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 sm:h-12 px-3 sm:px-4 rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-mushaf"
          >
            <option value="">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </form>

        <p aria-live="polite" className="text-sm text-stone-600 dark:text-stone-400 tabular-nums">
          {arabicNumber(visible.length)} من {arabicNumber(filtered.length)}
        </p>

        {loading ? (
          <LatestRowsSkeleton rows={MAX_SHOWN} />
        ) : visible.length === 0 ? (
          <p className="text-stone-600 dark:text-stone-400">لا يوجد ما يطابق البحث.</p>
        ) : (
          <ul className="space-y-2">
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="group flex items-start gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
                >
                  <LessonThumb youtubeUrl={item.youtubeUrl} audioUrl={item.audioUrl} className="w-20 sm:w-32 shrink-0" />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
                      {item.title}
                    </span>
                    <span className="block text-sm text-stone-600 dark:text-stone-400">{item.meta}</span>
                    <MediaIcons youtubeUrl={item.youtubeUrl} audioUrl={item.audioUrl} transcript={item.transcript} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
