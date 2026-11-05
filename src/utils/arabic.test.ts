import { describe, expect, it } from 'vitest';
import { COUNT_FORMS, formatArabicCount, getArabicLessonOrdinal } from './arabicNumbers';
import { normalizeArabic } from './arabicSearch';
import { formatAudioTime } from './timeFormat';

describe('normalizeArabic (search ignores marks and letter forms)', () => {
  it('treats the forms of alif as one letter', () => {
    expect(normalizeArabic('الأصول')).toBe(normalizeArabic('الاصول'));
    expect(normalizeArabic('إيمان')).toBe(normalizeArabic('ايمان'));
    expect(normalizeArabic('أحمد')).toBe('احمد');
  });
  it('treats ya and alif maqsura, and ta marbuta and ha, as the same', () => {
    expect(normalizeArabic('على')).toBe(normalizeArabic('علي'));
    expect(normalizeArabic('مدرسة')).toBe(normalizeArabic('مدرسه'));
  });
  it('drops the marks and the stretching line', () => {
    expect(normalizeArabic('العِلْمُ')).toBe('العلم');
    expect(normalizeArabic('الــعلم')).toBe('العلم');
  });
  it('lowercases other letters and copes with empty input', () => {
    expect(normalizeArabic('Fiqh')).toBe('fiqh');
    expect(normalizeArabic(null)).toBe('');
    expect(normalizeArabic(undefined)).toBe('');
  });
});

describe('getArabicLessonOrdinal', () => {
  it('writes the first lessons as ordinals', () => {
    expect(getArabicLessonOrdinal(1)).toBe('الدرس الأول');
    expect(getArabicLessonOrdinal(2)).toBe('الدرس الثاني');
    expect(getArabicLessonOrdinal(10)).toBe('الدرس العاشر');
    expect(getArabicLessonOrdinal(11)).toBe('الدرس الحادي عشر');
  });
});

describe('formatArabicCount (singular, dual, plural and the number-noun rules)', () => {
  const lessons = (n: number) => formatArabicCount(n, COUNT_FORMS.lesson);
  it('uses the singular and dual words without a digit', () => {
    expect(lessons(1)).toBe('درس واحد');
    expect(lessons(2)).toBe('درسان');
  });
  it('uses the plural from three to ten', () => {
    expect(lessons(3)).toBe('٣ دروس');
    expect(lessons(10)).toBe('١٠ دروس');
  });
  it('switches back to the singular noun after eleven', () => {
    expect(lessons(11)).toBe('١١ درسًا');
    expect(lessons(100)).toBe('١٠٠ درس');
  });
  it('writes views the same way', () => {
    expect(formatArabicCount(1, COUNT_FORMS.view)).toBe('مشاهدة واحدة');
    expect(formatArabicCount(2, COUNT_FORMS.view)).toBe('مشاهدتان');
  });
});

describe('formatAudioTime', () => {
  it('writes minutes and seconds, and hours only when there are some', () => {
    expect(formatAudioTime(5)).toBe('00:05');
    expect(formatAudioTime(65)).toBe('01:05');
    expect(formatAudioTime(3725)).toBe('1:02:05');
  });
});
