import { useEffect, useState } from 'react';
import { getReciters, getRiwayat, getSurahs } from '../../services/quran/quranApi';
import type { Moshaf, Reciter, Riwayah, Surah } from '../../services/quran/quranRules';

interface Catalog {
  reciters: Reciter[];
  surahs: Surah[];
  riwayat: Riwayah[];
  loading: boolean;
  // MP3Quran did not answer
  failed: boolean;
}

// The lists every Quran page needs: reciters with their masahif, the 114 surahs, and the riwayat
export function useQuranCatalog(): Catalog {
  const [state, setState] = useState<Catalog>({ reciters: [], surahs: [], riwayat: [], loading: true, failed: false });

  useEffect(() => {
    let alive = true;
    Promise.all([getReciters(), getSurahs(), getRiwayat()])
      .then(([reciters, surahs, riwayat]) => {
        if (alive) setState({ reciters, surahs, riwayat, loading: false, failed: reciters.length === 0 || surahs.length === 0 });
      })
      .catch(() => {
        if (alive) setState((s) => ({ ...s, loading: false, failed: true }));
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

const LAST_KEY = 'quran_reciter';
// Al-Husary's murattal: complete, with word timings; the reciter a visitor starts with
const DEFAULT_SERVER = 'mahmoud-husary/r1';

export interface Choice {
  reciter: Reciter;
  moshaf: Moshaf;
}

// The reciter and moshaf the visitor used last, or the default one; null until the reciters arrive
export function preferredChoice(reciters: Reciter[]): Choice | null {
  if (reciters.length === 0) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_KEY) || 'null') as { reciter?: number; moshaf?: number } | null;
    const reciter = reciters.find((r) => r.id === saved?.reciter);
    const moshaf = reciter?.moshaf.find((m) => m.id === saved?.moshaf);
    if (reciter && moshaf) return { reciter, moshaf };
  } catch {
    // nothing saved, or storage is off
  }
  for (const reciter of reciters) {
    const moshaf = reciter.moshaf.find((m) => m.server.includes(DEFAULT_SERVER));
    if (moshaf) return { reciter, moshaf };
  }
  return { reciter: reciters[0], moshaf: reciters[0].moshaf[0] };
}

export function rememberChoice(reciterId: number, moshafId: number): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ reciter: reciterId, moshaf: moshafId }));
  } catch {
    // private window: the default reciter is used next time
  }
}

export const readerPath = (reciterId: number, moshafId: number, surah: number) => `/quran/read/${reciterId}/${moshafId}/${surah}`;
