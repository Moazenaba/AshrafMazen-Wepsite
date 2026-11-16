import React from 'react';
import { hasSeparateBasmalah, type AyahText, type WordTiming } from '../../../services/quran/quranRules';

interface Props {
  surah: number;
  text: AyahText[];
  words: WordTiming[];
  level: 'word' | 'ayah' | 'none';
  fontSize: number;
  wordNodes: React.MutableRefObject<(HTMLElement | null)[]>;
  ayahNodes: React.MutableRefObject<Map<number, HTMLElement>>;
  // Called with the start (seconds) of the word or ayah the visitor tapped
  onSeek: (seconds: number) => void;
  ayahStarts: Map<number, number>;
}

// The surah's words, drawn once. A tap on a word (one handler on the container) jumps the recitation to it.
export const ReaderText = React.memo(function ReaderText({ surah, text, words, level, fontSize, wordNodes, ayahNodes, onSeek, ayahStarts }: Props) {
  // The index in `words` of each (ayah, position), to give every word span its place in the timing list
  const indexOf = new Map<string, number>();
  words.forEach(([ayah, position], i) => indexOf.set(`${ayah}:${position}`, i));
  wordNodes.current = [];

  const tap = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const word = target.closest<HTMLElement>('[data-i]');
    if (word) {
      const timing = words[Number(word.dataset.i)];
      if (timing) onSeek(timing[2] / 1000);
      return;
    }
    const ayah = target.closest<HTMLElement>('[data-ayah]');
    const start = ayah ? ayahStarts.get(Number(ayah.dataset.ayah)) : undefined;
    if (start !== undefined) onSeek(start / 1000);
  };

  return (
    <div dir="rtl" onClick={tap} style={{ fontSize }} className="font-amiri leading-[2.4] text-stone-900 dark:text-stone-100 text-center">
      {hasSeparateBasmalah(surah) && text.length > 0 && <p className="block mb-4 text-stone-700 dark:text-stone-300">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>}
      {text.map((ayah) => (
        <span key={ayah.ayah} data-ayah={ayah.ayah} ref={(el) => {
            if (el) ayahNodes.current.set(ayah.ayah, el);
          }} className="quran-ayah">
          {ayah.words.map((word) => {
            const i = level === 'word' ? indexOf.get(`${ayah.ayah}:${word.position}`) : undefined;
            return (
              <span key={word.position} data-i={i} ref={(el) => {
                if (i !== undefined) wordNodes.current[i] = el;
              }} className="quran-word">
                {word.text}{' '}
              </span>
            );
          })}
          <span aria-hidden="true" className="text-emerald-800 dark:text-amber-400 text-[0.7em]">﴿{new Intl.NumberFormat('ar-EG').format(ayah.ayah)}﴾ </span>
        </span>
      ))}
    </div>
  );
});
