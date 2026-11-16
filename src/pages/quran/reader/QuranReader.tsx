import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAudio } from '../../../context/AudioContext';
import { useQuranCatalog, rememberChoice, readerPath } from '../useQuranCatalog';
import { moshafSurahs, recitationCode, surahAudioUrl } from '../../../services/quran/quranRules';
import { useSurahSync } from './useSurahSync';
import { useHighlight } from './useHighlight';
import { ReaderText } from './ReaderText';
import { MAX_FONT, MIN_FONT, ReaderControls } from './ReaderControls';

const FONT_KEY = 'quran_font_size';
const DEFAULT_FONT = 30;
// After the visitor scrolls by hand, the page does not move for this long
const MANUAL_SCROLL_MS = 4000;

const savedFont = () => {
  try {
    const n = Number(localStorage.getItem(FONT_KEY));
    return n >= MIN_FONT && n <= MAX_FONT ? n : DEFAULT_FONT;
  } catch {
    return DEFAULT_FONT;
  }
};

// The reader: the surah's text follows the recitation, and a tap on a word jumps to it. Without the text service the surah
// still plays, with a line saying the synchronised text is not available.
export const QuranReader: React.FC = () => {
  const { reciterId, moshafId, surah: surahParam } = useParams();
  const surah = Number(surahParam);
  const navigate = useNavigate();
  const audio = useAudio();
  const { reciters, surahs, loading, failed } = useQuranCatalog();
  const reciter = useMemo(() => reciters.find((r) => String(r.id) === reciterId), [reciters, reciterId]);
  const moshaf = reciter?.moshaf.find((m) => String(m.id) === moshafId);
  const code = moshaf ? recitationCode(moshaf.server) : null;
  const sync = useSurahSync(moshaf ? code : null, surah);
  const [fontSize, setFontSize] = useState(savedFont);
  const [loop, setLoop] = useState(false);
  const [ayah, setAyah] = useState<number | null>(null);
  const wordNodes = useRef<(HTMLElement | null)[]>([]);
  const ayahNodes = useRef<Map<number, HTMLElement>>(new Map());
  const lastManualScroll = useRef(0);

  const trackId = moshaf ? `quran:${moshaf.id}:${surah}` : '';
  const surahName = surahs.find((s) => s.id === surah)?.name ?? '';
  const available = useMemo(() => (moshaf ? moshafSurahs(moshaf) : []), [moshaf]);
  const position = available.indexOf(surah);
  const mine = audio.track?.id === trackId;

  useHighlight({ trackId, level: sync.level, words: sync.words, ayahs: sync.ayahs, wordNodes, ayahNodes, loop, onAyah: setAyah });

  const start = useCallback(
    (at?: number) => {
      if (!reciter || !moshaf) return;
      audio.play({ id: trackId, title: `سورة ${surahName}`, subtitle: reciter.name, src: surahAudioUrl(moshaf.server, surah), href: readerPath(reciter.id, moshaf.id, surah) }, at);
    },
    [audio, reciter, moshaf, trackId, surahName, surah]
  );

  useEffect(() => {
    if (reciter && moshaf) rememberChoice(reciter.id, moshaf.id);
    if (reciter) document.title = `سورة ${surahName} - ${reciter.name}`;
  }, [reciter, moshaf, surahName]);

  // The page scrolls to the ayah being recited, only when the ayah changes and the visitor did not scroll by hand lately
  useEffect(() => {
    const onScroll = () => {
      lastManualScroll.current = Date.now();
    };
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
    };
  }, []);
  useEffect(() => {
    if (ayah === null || Date.now() - lastManualScroll.current < MANUAL_SCROLL_MS) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    ayahNodes.current.get(ayah)?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [ayah]);

  const ayahStarts = useMemo(() => new Map(sync.ayahs.map(([a, startMs]) => [a, startMs])), [sync.ayahs]);
  const seekTo = useCallback((seconds: number) => (mine ? audio.seek(seconds) : start(seconds)), [mine, audio, start]);
  const changeFont = (size: number) => {
    const next = Math.min(MAX_FONT, Math.max(MIN_FONT, size));
    setFontSize(next);
    try {
      localStorage.setItem(FONT_KEY, String(next));
    } catch {
      // not remembered, nothing worse
    }
  };
  const goTo = (n: number | undefined) => n && reciter && moshaf && navigate(readerPath(reciter.id, moshaf.id, n));

  if (loading) return <p className="py-20 text-center text-stone-600 dark:text-stone-400" aria-busy="true">جارٍ التحميل…</p>;
  if (failed || !reciter || !moshaf || position < 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-stone-600 dark:text-stone-400">{failed ? 'تعذّر تحميل البيانات الآن.' : 'لم نجد هذه السورة لهذا القارئ.'}</p>
        <Link to="/quran" className="font-semibold text-emerald-800 dark:text-emerald-400 hover:underline">العودة إلى القرآن الكريم</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <nav className="text-sm text-stone-600 dark:text-stone-400">
        <Link to="/quran" className="hover:underline">القرآن الكريم</Link> / <Link to={`/quran/reciter/${reciter.id}`} className="hover:underline">{reciter.name}</Link>
      </nav>
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">سورة {surahName}</h1>
      <ReaderControls
        playing={mine && audio.playing}
        rate={audio.rate}
        loop={loop}
        fontSize={fontSize}
        hasPrevious={position > 0}
        hasNext={position < available.length - 1}
        onToggle={() => (mine ? audio.toggle() : start())}
        onPrevious={() => goTo(available[position - 1])}
        onNext={() => goTo(available[position + 1])}
        onRate={audio.setRate}
        onLoop={() => setLoop((on) => !on)}
        onFont={changeFont}
      />
      {sync.loading ? (
        <p className="py-10 text-center text-stone-600 dark:text-stone-400" aria-busy="true">جارٍ تحميل النص…</p>
      ) : (
        <>
          {sync.level === 'none' && <p role="status" className="text-center text-stone-600 dark:text-stone-400">النص المتزامن غير متاح لهذه التلاوة الآن.</p>}
          <ReaderText surah={surah} text={sync.text} words={sync.words} level={sync.level} fontSize={fontSize} wordNodes={wordNodes} ayahNodes={ayahNodes} onSeek={seekTo} ayahStarts={ayahStarts} />
        </>
      )}
    </div>
  );
};
