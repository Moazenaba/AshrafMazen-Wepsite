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
