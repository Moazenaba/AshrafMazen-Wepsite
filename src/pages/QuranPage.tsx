import React, { useEffect, useState } from 'react';
import { RecitersList } from './quran/RecitersList';
import { RadiosList } from './quran/RadiosList';
import { SurahGrid } from './quran/SurahGrid';
import { preferredChoice, readerPath, useQuranCatalog } from './quran/useQuranCatalog';
import { firstReciterWith, moshafSurahs } from '../services/quran/quranRules';

// The Quran section: recitations by reciter, and live Quran radio stations
export const QuranPage: React.FC = () => {
  const { reciters, surahs, riwayat, loading, failed } = useQuranCatalog();
  const [tab, setTab] = useState<'reciters' | 'surahs' | 'radios'>('reciters');

  // A surah opens in the reader with the reciter used last, else the first reciter who has that surah
  const surahLink = (n: number) => {
    const last = preferredChoice(reciters);
    const choice = last && moshafSurahs(last.moshaf).includes(n) ? last : firstReciterWith(n, reciters);
    return choice ? readerPath(choice.reciter.id, choice.moshaf.id, n) : '/quran';
  };

  useEffect(() => {
    document.title = 'القرآن الكريم - الشيخ أشرف مازن';
  }, []);

  const tabClass = (on: boolean) =>
    `min-h-11 px-5 rounded-full font-semibold ${on ? 'bg-emerald-800 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'}`;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">القرآن الكريم</h1>
        <p className="text-stone-600 dark:text-stone-400">استمع إلى المصحف بأصوات القرّاء، أو إلى إذاعات القرآن المباشرة.</p>
      </header>
      <div className="flex gap-2" role="tablist">
        <button role="tab" aria-selected={tab === 'reciters'} className={tabClass(tab === 'reciters')} onClick={() => setTab('reciters')}>القرّاء</button>
        <button role="tab" aria-selected={tab === 'surahs'} className={tabClass(tab === 'surahs')} onClick={() => setTab('surahs')}>السور</button>
        <button role="tab" aria-selected={tab === 'radios'} className={tabClass(tab === 'radios')} onClick={() => setTab('radios')}>الإذاعات</button>
      </div>
      {tab === 'radios' ? (
        <RadiosList />
      ) : loading ? (
        <p className="py-10 text-center text-stone-600 dark:text-stone-400" aria-busy="true">جارٍ التحميل…</p>
      ) : failed ? (
        <p className="py-10 text-center text-stone-600 dark:text-stone-400">تعذّر تحميل قائمة القرّاء الآن، حاول مرة أخرى بعد قليل.</p>
      ) : tab === 'surahs' ? (
        <SurahGrid surahs={surahs} to={(n) => surahLink(n)} />
      ) : (
        <RecitersList reciters={reciters} riwayat={riwayat} />
      )}
    </div>
  );
};
