import { useEffect, useRef } from 'react';
import { useAudio } from '../../../context/AudioContext';
import { ayahAt, shouldLoopBack, wordIndexAt, type AyahTiming, type WordTiming } from '../../../services/quran/quranRules';

const ACTIVE = 'quran-active';

interface Options {
  trackId: string;
  level: 'word' | 'ayah' | 'none';
  words: WordTiming[];
  ayahs: AyahTiming[];
  // The word elements, in the order of `words`, and the ayah elements by ayah number
  wordNodes: React.MutableRefObject<(HTMLElement | null)[]>;
  ayahNodes: React.MutableRefObject<Map<number, HTMLElement>>;
  loop: boolean;
  onAyah: (ayah: number | null) => void;
}

// Follows the recitation: one animation-frame loop while this surah plays. It reads the player's time and changes the
// highlight by toggling a class on elements kept in refs. It never updates React state per frame (React would redraw the whole
// text 60 times a second); the page is told only when the ayah changes.
export function useHighlight({ trackId, level, words, ayahs, wordNodes, ayahNodes, loop, onAyah }: Options): void {
  const audio = useAudio();
  const clock = useRef({ seconds: 0, at: 0 });
  const live = useRef({ playing: false, rate: 1, loop, seek: audio.seek, onAyah });
  const mine = audio.track?.id === trackId;

  // The player's time moves about four times a second; between its updates the position is estimated from the clock
  useEffect(() => {
    clock.current = { seconds: audio.time, at: performance.now() };
  }, [audio.time]);
  live.current = { playing: audio.playing && mine, rate: audio.rate, loop, seek: audio.seek, onAyah };

  useEffect(() => {
    if (level === 'none' || !audio.playing || !mine) return;
    let frame = 0;
    let lastWord = -1;
    let lastAyah: number | null = null;
    const tick = () => {
      const { seconds, at } = clock.current;
      const ms = (seconds + ((performance.now() - at) / 1000) * live.current.rate) * 1000;
      if (level === 'word') {
        const index = wordIndexAt(words, ms);
        if (index !== lastWord) {
          wordNodes.current[lastWord]?.classList.remove(ACTIVE);
          wordNodes.current[index]?.classList.add(ACTIVE);
          lastWord = index;
        }
      }
      const ayah = ayahAt(ayahs, ms);
      if (ayah !== lastAyah) {
        if (level === 'ayah') {
          if (lastAyah !== null) ayahNodes.current.get(lastAyah)?.classList.remove(ACTIVE);
          if (ayah !== null) ayahNodes.current.get(ayah)?.classList.add(ACTIVE);
        }
        lastAyah = ayah;
        live.current.onAyah(ayah);
      }
      const back = shouldLoopBack(ms, ayahs.find((a) => a[0] === ayah), live.current.loop);
      if (back !== null) {
        live.current.seek(back / 1000);
        clock.current = { seconds: back / 1000, at: performance.now() };
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [level, words, ayahs, audio.playing, mine, wordNodes, ayahNodes]);
}
