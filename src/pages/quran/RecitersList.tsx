import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { normalizeArabic } from '../../utils/arabicSearch';
import type { Reciter, Riwayah } from '../../services/quran/quranRules';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// Every reciter, searched by name and filtered by riwayah; each opens his page with his masahif and surahs
export const RecitersList: React.FC<{ reciters: Reciter[]; riwayat: Riwayah[] }> = ({ reciters, riwayat }) => {
  const [query, setQuery] = useState('');
  const [riwayah, setRiwayah] = useState(0);

  // Only the riwayat some reciter actually has
  const used = useMemo(() => {
    const ids = new Set(reciters.flatMap((r) => r.moshaf.map((m) => m.rewaya_id)));
    return riwayat.filter((r) => ids.has(r.id));
  }, [reciters, riwayat]);

  const shown = useMemo(() => {
    const q = normalizeArabic(query.trim());
    return reciters
      .filter((r) => (riwayah ? r.moshaf.some((m) => m.rewaya_id === riwayah) : true))
      .filter((r) => (q ? normalizeArabic(r.name).includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [reciters, query, riwayah]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
        <label className="relative block">
          <span className="sr-only">ابحث عن قارئ</span>
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-stone-500" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم القارئ"
            className="w-full h-12 ps-10 pe-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </label>
        <label className="block">
          <span className="sr-only">الرواية</span>
          <select
            value={riwayah}
            onChange={(e) => setRiwayah(Number(e.target.value))}
            className="w-full h-12 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value={0}>كل الروايات</option>
            {used.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="text-sm text-stone-600 dark:text-stone-400">
        {arabicNumber(shown.length)} قارئ
      </p>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-stone-600 dark:text-stone-400">لا يوجد قارئ بهذا الاسم. جرّب كلمة أخرى أو اختر «كل الروايات».</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {shown.map((reciter) => (
            <li key={reciter.id}>
              <Link
                to={`/quran/reciter/${reciter.id}`}
                className="press flex items-center justify-between gap-3 min-h-14 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <span className="min-w-0 font-semibold text-stone-900 dark:text-stone-100 truncate">{reciter.name}</span>
                <span className="shrink-0 text-xs text-stone-600 dark:text-stone-400">
                  {reciter.moshaf.length > 1 ? `${arabicNumber(reciter.moshaf.length)} مصاحف` : `${arabicNumber(reciter.moshaf[0].surah_total)} سورة`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
