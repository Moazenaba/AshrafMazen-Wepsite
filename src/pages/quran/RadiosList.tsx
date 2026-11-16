import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Search } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import { getRadios } from '../../services/quran/quranApi';
import type { Radio } from '../../services/quran/quranRules';
import { normalizeArabic } from '../../utils/arabicSearch';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);
const radioTrackId = (id: number) => `quran-radio:${id}`;

// The Quran radio stations: live streams played in the site's own player, so they keep playing between pages
export const RadiosList: React.FC = () => {
  const [radios, setRadios] = useState<Radio[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const audio = useAudio();

  useEffect(() => {
    let alive = true;
    getRadios()
      .then((list) => alive && setRadios(list))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = normalizeArabic(query.trim());
    return (radios ?? []).filter((r) => (q ? normalizeArabic(r.name).includes(q) : true));
  }, [radios, query]);

  if (failed) return <p className="py-10 text-center text-stone-600 dark:text-stone-400">تعذّر تحميل الإذاعات الآن. حاول بعد قليل.</p>;
  if (!radios) return <div className="min-h-[40vh]" aria-busy="true" />;

  return (
    <div className="space-y-4">
      <label className="relative block max-w-md">
        <span className="sr-only">ابحث عن إذاعة</span>
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-stone-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الإذاعة أو القارئ"
          className="w-full h-12 ps-10 pe-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
      </label>
      <p role="status" className="text-sm text-stone-600 dark:text-stone-400">
        {arabicNumber(shown.length)} إذاعة بث مباشر
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {shown.map((radio) => {
          const id = radioTrackId(radio.id);
          const active = audio.track?.id === id;
          const playing = active && audio.playing;
          return (
            <li key={radio.id}>
              <button
                type="button"
                onClick={() => (active ? audio.toggle() : audio.play({ id, title: radio.name, subtitle: 'إذاعة قرآن بث مباشر', src: radio.url, href: '/quran?tab=radios' }, 0))}
                aria-pressed={playing}
                className={`press w-full flex items-center gap-3 min-h-14 px-4 py-2 rounded-xl text-start transition-colors ${
                  active ? 'bg-mushaf text-gold-soft' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100'
                }`}
              >
                <span className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-full ${active ? 'bg-gold text-mushaf-deep' : 'bg-stone-100 dark:bg-stone-700 text-mushaf dark:text-gold-soft'}`}>
                  {playing ? <Pause className="w-4 h-4 fill-current" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current ms-0.5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 font-semibold truncate">{radio.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
