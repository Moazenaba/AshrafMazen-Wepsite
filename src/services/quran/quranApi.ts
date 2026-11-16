// The Quran page's data, straight from MP3Quran (free, no key, open to any site). Nothing passes through this site's
// server, so the page adds no load or log lines to it.
//   v3: the lists (reciters and their masahif, surahs, riwayat, radios), cached by the browser for a day.
//   v4: the written text and the word and ayah timings. v4 is still served from a staging address: when it does not
//       answer, a surah is simply played without its text (the page says so) and everything else keeps working.
import { timedFetch } from '../../lib/timedFetch';
import { parseAyahs, parseText, parseWords, ayahsFromWords, type AyahText, type AyahTiming, type Radio, type Reciter, type Riwayah, type Surah, type WordTiming } from './quranRules';

const V3 = 'https://www.mp3quran.net/api/v3';
// staging address; check https://mp3quran.net/api for a stable one. A move to a production address is this one line.
export const QURAN_SYNC_BASE = 'https://api-staging.mp3quran.net/v4';
const V4 = QURAN_SYNC_BASE;
// 8 seconds: a service that does not answer must not hold the reader

// One request per address for the whole visit; a failed one is forgotten so the next page tries again
const memo = new Map<string, Promise<unknown>>();
function json(url: string): Promise<unknown> {
  let request = memo.get(url);
  if (!request) {
    request = timedFetch(url, {}, 8000).then((response) => {
      if (!response.ok) throw new Error(`${response.status}`);
      return response.json();
    });
    request.catch(() => memo.delete(url));
    memo.set(url, request);
  }
  return request;
}

const list = <T>(value: unknown, key: string): T[] => {
  const items = (value as Record<string, unknown> | null)?.[key];
  return Array.isArray(items) ? (items as T[]) : [];
};

export const getReciters = () => json(`${V3}/reciters?language=ar`).then((j) => list<Reciter>(j, 'reciters').filter((r) => Array.isArray(r.moshaf) && r.moshaf.length > 0));
export const getSurahs = () => json(`${V3}/suwar?language=ar`).then((j) => list<Surah>(j, 'suwar'));
export const getRiwayat = () => json(`${V3}/riwayat?language=ar`).then((j) => list<Riwayah>(j, 'riwayat'));
export const getRadios = () => json(`${V3}/radios?language=ar`).then((j) => list<Radio>(j, 'radios').filter((r) => r.url));

// How closely a surah can be followed while it plays
export type SyncLevel = 'word' | 'ayah' | 'none';

export interface SurahSync {
  level: SyncLevel;
  text: AyahText[];
  words: WordTiming[];
  ayahs: AyahTiming[];
}

const data = (value: unknown) => ((value as { data?: Record<string, unknown> } | null)?.data ?? {}) as Record<string, any>;

// A successful v4 answer is kept for the visit; larger than this it is not worth the storage
const MAX_CACHED_CHARS = 400_000;
const cacheKey = (code: string, surah: number) => `quran-sync:${code}:${surah}`;

function readCached(code: string, surah: number): SurahSync | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(code, surah));
    return raw ? (JSON.parse(raw) as SurahSync) : null;
  } catch {
    return null;
  }
}

function writeCached(code: string, surah: number, value: SurahSync): void {
  try {
    const raw = JSON.stringify(value);
    if (raw.length <= MAX_CACHED_CHARS) sessionStorage.setItem(cacheKey(code, surah), raw);
  } catch {
    // storage is off or full: the next visit asks again
  }
}

const NONE: SurahSync = { level: 'none', text: [], words: [], ayahs: [] };

// The text of a surah and, when this recitation has them, its word and ayah timings. It never throws: any failure of the
// v4 service gives level "none" (the surah then plays without a synchronised text).
// `code` is the recitation's v4 code (quranRules.recitationCode); null when the moshaf's address gives none.
export async function getSurahSync(code: string | null, surah: number): Promise<SurahSync> {
  try {
    if (code) {
      const cached = readCached(code, surah);
      if (cached) return cached;
      const base = `${V4}/recitations/${code}/surahs/${surah}`;
      // The words (with the text in this recitation's own riwayah) and the ayahs (which also carry the basmalah, ayah 0)
      const [wordsAnswer, ayahsAnswer] = await Promise.all([json(`${base}/word-timings?include=text`).catch(() => null), json(`${base}/ayah-timings`).catch(() => null)]);
      const words = parseWords(data(wordsAnswer).words);
      const text = parseText(data(wordsAnswer).text?.ayahs);
      const ayahs = parseAyahs(data(ayahsAnswer).ayahs);
      let result: SurahSync | null = null;
      if (words.length > 0 && text.length > 0) result = { level: 'word', text, words, ayahs: ayahs.length > 0 ? ayahs : ayahsFromWords(words) };
      else if (ayahs.length > 0) result = { level: 'ayah', text: await plainText(surah), words: [], ayahs };
      if (result) {
        writeCached(code, surah, result);
        return result;
      }
    }
    return { ...NONE, text: await plainText(surah) };
  } catch {
    return NONE;
  }
}

// The text alone (Hafs), for a recitation with no word timings; empty when v4 does not answer
const plainText = (surah: number): Promise<AyahText[]> =>
  json(`${V4}/surahs/${surah}/text`)
    .then((j) => parseText(data(j).ayahs))
    .catch(() => []);
