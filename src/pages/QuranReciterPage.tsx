import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SurahGrid } from './quran/SurahGrid';
import { useQuranCatalog } from './quran/useQuranCatalog';
import { moshafSurahs, surahAudioUrl } from '../services/quran/quranRules';

// One reciter: pick a moshaf (riwayah), then a surah to play in the site's player
export const QuranReciterPage: React.FC = () => {
  const { id } = useParams();
  const { reciters, surahs, riwayat, loading, failed } = useQuranCatalog();
  const audio = useAudio();
  const reciter = useMemo(() => reciters.find((r) => String(r.id) === id), [reciters, id]);
  const [moshafId, setMoshafId] = useState<number | null>(null);
  const moshaf = reciter?.moshaf.find((m) => m.id === moshafId) ?? reciter?.moshaf[0];
  const [params] = useSearchParams();
  const chosen = Number(params.get('surah')) || undefined;
  const { play: startTrack } = audio;

  // Opening a surah (a link with ?surah=) starts it in the site's player
  useEffect(() => {
    if (!reciter || !moshaf || !chosen || surahs.length === 0) return;
    const name = surahs.find((s) => s.id === chosen)?.name ?? '';
    startTrack({ id: `quran:${moshaf.id}:${chosen}`, title: `سورة ${name}`, subtitle: reciter.name, src: surahAudioUrl(moshaf.server, chosen), href: `/quran/reciter/${reciter.id}?surah=${chosen}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter?.id, moshaf?.id, chosen, surahs.length]);

  useEffect(() => {
    if (reciter) document.title = `${reciter.name} - القرآن الكريم`;
  }, [reciter]);

  if (loading) return <p className="py-20 text-center text-stone-600 dark:text-stone-400" aria-busy="true">جارٍ التحميل…</p>;
  if (failed || !reciter || !moshaf) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-stone-600 dark:text-stone-400">{failed ? 'تعذّر تحميل البيانات الآن.' : 'لم نجد هذا القارئ.'}</p>
        <Link to="/quran" className="font-semibold text-emerald-800 dark:text-emerald-400 hover:underline">العودة إلى القرآن الكريم</Link>
      </div>
    );
  }

  const available = moshafSurahs(moshaf);
  const trackId = chosen ? `quran:${moshaf.id}:${chosen}` : '';
  const isCurrent = !!chosen && audio.track?.id === trackId;
  const surahName = surahs.find((s) => s.id === chosen)?.name ?? '';

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <nav className="text-sm text-stone-600 dark:text-stone-400">
        <Link to="/quran" className="hover:underline">القرآن الكريم</Link> / {reciter.name}
      </nav>
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">{reciter.name}</h1>
      {reciter.moshaf.length > 1 && (
        <label className="block max-w-md space-y-1">
          <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">المصحف</span>
          <select
            value={moshaf.id}
            onChange={(e) => setMoshafId(Number(e.target.value))}
            className="w-full h-12 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100"
          >
            {reciter.moshaf.map((m) => (
              <option key={m.id} value={m.id}>{m.name || riwayat.find((r) => r.id === m.rewaya_id)?.name}</option>
            ))}
          </select>
        </label>
      )}
      {chosen && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900">
          <button
            onClick={() => audio.toggle()}
            aria-label={isCurrent && audio.playing ? 'إيقاف مؤقت' : 'تشغيل'}
            className="w-11 h-11 rounded-full bg-emerald-800 text-white flex items-center justify-center"
          >
            {isCurrent && audio.playing ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
          </button>
          <span className="font-semibold text-stone-900 dark:text-stone-100">سورة {surahName}</span>
        </div>
      )}
      <p className="text-stone-600 dark:text-stone-400">اختر سورة للاستماع إليها.</p>
      <SurahGrid surahs={surahs} available={available} current={chosen} to={(n) => `/quran/reciter/${reciter.id}?surah=${n}`} />
    </div>
  );
};
