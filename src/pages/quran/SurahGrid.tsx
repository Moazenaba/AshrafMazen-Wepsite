import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { normalizeArabic } from '../../utils/arabicSearch';
import type { Surah } from '../../services/quran/quranRules';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// The surahs as a grid of links. `available` limits it to the surahs a moshaf has; `to` gives each surah's address;
// `current` marks the one being read.
export const SurahGrid: React.FC<{ surahs: Surah[]; to: (surah: number) => string; available?: number[]; current?: number }> = ({ surahs, to, available, current }) => {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const has = available ? new Set(available) : null;
    const q = normalizeArabic(query.trim());
    return surahs.filter((s) => (has ? has.has(s.id) : true)).filter((s) => (q ? normalizeArabic(s.name).includes(q) || String(s.id) === query.trim() : true));
  }, [surahs, available, query]);

  return (
    <div className="space-y-4">
      <label className="relative block max-w-md">
        <span className="sr-only">ابحث عن سورة</span>
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-stone-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم السورة أو رقمها"
          className="w-full h-12 ps-10 pe-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
      </label>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-stone-600 dark:text-stone-400">لا توجد سورة بهذا الاسم.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {shown.map((surah) => (
            <li key={surah.id}>
              <Link
                to={to(surah.id)}
                aria-current={surah.id === current ? 'true' : undefined}
                className={`press flex items-center gap-3 min-h-14 px-3 py-2 rounded-xl transition-colors ${
                  surah.id === current ? 'bg-mushaf text-gold-soft' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100'
                }`}
              >
                <span className={`shrink-0 w-9 text-center text-sm tabular-nums ${surah.id === current ? 'text-gold-soft' : 'text-stone-600 dark:text-stone-400'}`}>{arabicNumber(surah.id)}</span>
                <span className="min-w-0">
                  <span className="block font-amiri text-lg leading-tight truncate">{surah.name}</span>
                  <span className={`block text-xs ${surah.id === current ? 'text-gold-soft/80' : 'text-stone-600 dark:text-stone-400'}`}>{surah.makkia ? 'مكية' : 'مدنية'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
