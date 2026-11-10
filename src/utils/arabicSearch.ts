// Arabic search: ignore the marks and the letter forms.
// Arabic search ignores the marks above and below letters and the stretching line, and treats the forms of alif,
// alif maqsura / ya and ta marbuta / ha as the same letter, so "الأصول" finds "الاصول" and "احمد" finds "أحمد"
export const normalizeArabic = (text: string | null | undefined): string =>
  (text || '')
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();

// The words of a text after normalizing: punctuation (| - « » ، :) and extra spaces do not count
const wordsOf = (text: string | null | undefined): string[] =>
  normalizeArabic(text)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter(Boolean);

// How well a text answers a search: 0 = not at all. The words may come in any order and with any punctuation between
// them, and a long search still finds its lesson when one or two of its words are not in the title (a typo, an extra word).
export function searchScore(text: string | null | undefined, query: string | null | undefined): number {
  const needles = wordsOf(query);
  if (needles.length === 0) return 0;
  const haystack = wordsOf(text).join(' ');
  if (!haystack) return 0;
  const whole = needles.join(' ');
  if (haystack.includes(whole)) return needles.length + 1;
  const found = needles.filter((w) => haystack.includes(w)).length;
  const required = needles.length <= 2 ? needles.length : Math.ceil(needles.length * 0.7);
  return found >= required ? found : 0;
}
