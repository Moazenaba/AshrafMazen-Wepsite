import { describe, expect, it } from 'vitest';
import { ayahAt, ayahsFromWords, hasSeparateBasmalah, moshafSurahs, parseAyahs, parseText, parseWords, recitationCode, surahAudioUrl, wordIndexAt, type WordTiming } from './quranRules';

// Al-Fatihah by Al-Husary, as the API answers (first two ayahs)
const WORDS: WordTiming[] = [
  [1, 1, 6409, 6947],
  [1, 2, 6947, 7667],
  [1, 3, 7667, 8828],
  [1, 4, 8828, 12360],
  [2, 1, 12361, 13189],
  [2, 2, 13189, 14069],
];

describe('quran: addresses', () => {
  it('builds the address of a surah recording', () => {
    expect(surahAudioUrl('https://cdn.mp3quran.net/audio/mahmoud-husary/r1/', 1)).toBe('https://cdn.mp3quran.net/audio/mahmoud-husary/r1/001.mp3');
    expect(surahAudioUrl('https://server8.mp3quran.net/afs', 114)).toBe('https://server8.mp3quran.net/afs/114.mp3');
  });

  it('reads the v4 code of a recitation from its address, or null for another shape', () => {
    expect(recitationCode('https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/')).toBe('ibrahim-akhdar/r1');
    expect(recitationCode('https://cdn.mp3quran.net/audio/mahmoud-husary/r12')).toBe('mahmoud-husary/r12');
    expect(recitationCode('https://server8.mp3quran.net/afs/')).toBeNull();
  });

  it('lists the surahs of a moshaf', () => {
    expect(moshafSurahs({ surah_list: '1,2,114' })).toEqual([1, 2, 114]);
    expect(moshafSurahs({ surah_list: '1,,x,200,36' })).toEqual([1, 36]);
  });
});

describe('quran: what is being recited now', () => {
  it('finds the word at a moment: the last one that has started', () => {
    expect(wordIndexAt(WORDS, 0)).toBe(-1);
    expect(wordIndexAt(WORDS, 6409)).toBe(0);
    expect(wordIndexAt(WORDS, 6946)).toBe(0);
    expect(wordIndexAt(WORDS, 6947)).toBe(1);
    expect(wordIndexAt(WORDS, 12360)).toBe(3);
    expect(wordIndexAt(WORDS, 999999)).toBe(5);
    expect(wordIndexAt([], 100)).toBe(-1);
  });

  it('derives each ayah from its words, and finds the ayah at a moment', () => {
    const ayahs = ayahsFromWords(WORDS);
    expect(ayahs).toEqual([
      [1, 6409, 12360],
      [2, 12361, 14069],
    ]);
    expect(ayahAt(ayahs, 100)).toBeNull();
    expect(ayahAt(ayahs, 7000)).toBe(1);
    expect(ayahAt(ayahs, 12361)).toBe(2);
  });
});

describe('quran: reading the API answers', () => {
  it('reads the words of a surah and leaves out anything malformed', () => {
    const text = parseText([[1, [[1, 'بِسۡمِ', 'بسم', 1], [2, 'ٱللَّهِ', 'الله', 2], ['bad']]], 'junk', [2, []]]);
    expect(text).toEqual([{ ayah: 1, words: [{ position: 1, text: 'بِسۡمِ' }, { position: 2, text: 'ٱللَّهِ' }] }]);
    expect(parseText(null)).toEqual([]);
  });

  it('reads word and ayah timings in the order heard', () => {
    expect(parseWords([[1, 2, 500, 900, 1], [1, 1, 0, 500, 1], ['x'], [1, 3]])).toEqual([
      [1, 1, 0, 500],
      [1, 2, 500, 900],
    ]);
    expect(parseAyahs([[2, 900, 1500, 'نص'], [1, 0, 900, 'نص']])).toEqual([
      [1, 0, 900],
      [2, 900, 1500],
    ]);
    expect(parseWords(undefined)).toEqual([]);
  });

  it('knows which surahs open with a separate basmalah', () => {
    expect(hasSeparateBasmalah(1)).toBe(false);
    expect(hasSeparateBasmalah(9)).toBe(false);
    expect(hasSeparateBasmalah(2)).toBe(true);
  });
});
