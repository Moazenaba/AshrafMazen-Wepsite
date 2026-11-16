import { useEffect, useState } from 'react';
import { getSurahSync, type SurahSync } from '../../../services/quran/quranApi';

const NONE: SurahSync = { level: 'none', text: [], words: [], ayahs: [] };

// Loads a surah's text and timings. getSurahSync never throws; a failure arrives as level "none".
export function useSurahSync(code: string | null, surah: number): SurahSync & { loading: boolean } {
  const [state, setState] = useState<SurahSync & { loading: boolean }>({ ...NONE, loading: true });

  useEffect(() => {
    let alive = true;
    setState({ ...NONE, loading: true });
    getSurahSync(code, surah).then((sync) => {
      if (alive) setState({ ...sync, loading: false });
    });
    return () => {
      alive = false;
    };
  }, [code, surah]);

  return state;
}
