// Pure rules of the Quran page (no network, no screen): the shapes MP3Quran answers with, the address of a surah's
// recording, and which word or ayah is being recited at a given moment.
//
// Two versions of the MP3Quran API are used:
//   v3 (stable): the lists - reciters with their masahif, surahs, riwayat, radios.
//   v4 (still on a staging address): the written text word by word, and when each word and ayah is heard.
// The two meet in a moshaf's `server` address: ".../audio/<reciter>/r<n>/" is the v4 code of that recitation.

export interface Moshaf {
  id: number;
  name: string;
  rewaya_id: number;
  server: string;
  surah_total: number;
  surah_list: string;
}

export interface Reciter {
  id: number;
  name: string;
  letter: string;
  moshaf: Moshaf[];
}

export interface Surah {
  id: number;
  name: string;
  start_page: number;
  end_page: number;
  // 1 = Makki, 0 = Madani
  makkia: number;
}

export interface Riwayah {
  id: number;
  name: string;
}

export interface Radio {
  id: number;
  name: string;
  url: string;
}

// One spoken word: [ayah, position in the ayah, start ms, end ms]
export type WordTiming = [ayah: number, position: number, startMs: number, endMs: number];
// One ayah: [ayah, start ms, end ms]. Ayah 0 is the basmalah, -1 the istiadhah
export type AyahTiming = [ayah: number, startMs: number, endMs: number];
// The written text: each ayah with its words in the Uthmani script
export interface AyahText {
  ayah: number;
  words: { position: number; text: string }[];
}

export const SURAH_COUNT = 114;
const pad3 = (n: number) => String(n).padStart(3, '0');

// The recording of one surah of a moshaf
export const surahAudioUrl = (server: string, surah: number) => `${server.endsWith('/') ? server : `${server}/`}${pad3(surah)}.mp3`;

// The v4 code of a moshaf's recitation ("mahmoud-husary/r1"), or null when its address has another shape
export function recitationCode(server: string): string | null {
  return server.match(/\/audio\/([a-z0-9-]+\/r\d+)\/?$/i)?.[1] ?? null;
}

// The surahs a moshaf has, in order
export const moshafSurahs = (moshaf: Pick<Moshaf, 'surah_list'>): number[] =>
  moshaf.surah_list
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= SURAH_COUNT);

// The index of the word being recited at `ms`: the last word that has started. -1 before the first word.
// Words are in the order heard, so their start times rise: a binary search, called many times a second.
export function wordIndexAt(words: WordTiming[], ms: number): number {
  let low = 0;
  let high = words.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (words[mid][2] <= ms) {
      found = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return found;
}

// The same for ayahs: the ayah being recited at `ms`, or null before the first one
export function ayahAt(ayahs: AyahTiming[], ms: number): number | null {
  let low = 0;
  let high = ayahs.length - 1;
  let found: number | null = null;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (ayahs[mid][1] <= ms) {
      found = ayahs[mid][0];
      low = mid + 1;
    } else high = mid - 1;
  }
  return found;
}

// When each ayah starts and ends, from its words (for a recitation that has word timings)
export function ayahsFromWords(words: WordTiming[]): AyahTiming[] {
  const ayahs: AyahTiming[] = [];
  for (const [ayah, , start, end] of words) {
    const last = ayahs[ayahs.length - 1];
    if (last && last[0] === ayah) last[2] = end;
    else ayahs.push([ayah, start, end]);
  }
  return ayahs;
}

// What v4 answers for a surah's words: [[ayah, [[position, uthmani, imlai, n], ...]], ...]
export function parseText(raw: unknown): AyahText[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is [number, unknown[]] => Array.isArray(entry) && typeof entry[0] === 'number' && Array.isArray(entry[1]))
    .map(([ayah, words]) => ({
      ayah,
      words: words
        .filter((w): w is [number, string] => Array.isArray(w) && typeof w[0] === 'number' && typeof w[1] === 'string')
        .map(([position, text]) => ({ position, text })),
    }))
    .filter((a) => a.words.length > 0);
}

// What v4 answers for word timings: [[ayah, position, start, end, occurrence], ...]; anything malformed is left out
export function parseWords(raw: unknown): WordTiming[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((w): w is number[] => Array.isArray(w) && w.length >= 4 && w.slice(0, 4).every((n) => typeof n === 'number'))
    .map(([ayah, position, start, end]) => [ayah, position, start, end] as WordTiming)
    .sort((a, b) => a[2] - b[2]);
}

export function parseAyahs(raw: unknown): AyahTiming[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is number[] => Array.isArray(a) && a.length >= 3 && a.slice(0, 3).every((n) => typeof n === 'number'))
    .map(([ayah, start, end]) => [ayah, start, end] as AyahTiming)
    .sort((a, b) => a[1] - b[1]);
}

// Every surah opens with the basmalah except At-Tawbah (9); in Al-Fatihah (1) it is the first ayah itself
export const hasSeparateBasmalah = (surah: number) => surah !== 1 && surah !== 9;

// "Repeat the ayah": when the current ayah is about to end (within 80 ms), the time to jump back to (its start); else null
export function shouldLoopBack(timeMs: number, ayah: AyahTiming | undefined, enabled: boolean): number | null {
  if (!enabled || !ayah) return null;
  return timeMs >= ayah[2] - 80 && timeMs >= ayah[1] ? ayah[1] : null;
}

// The first reciter (in the given order) whose moshaf has this surah
export function firstReciterWith(surah: number, reciters: Reciter[]): { reciter: Reciter; moshaf: Moshaf } | null {
  for (const reciter of reciters) {
    const moshaf = reciter.moshaf.find((m) => moshafSurahs(m).includes(surah));
    if (moshaf) return { reciter, moshaf };
  }
  return null;
}
