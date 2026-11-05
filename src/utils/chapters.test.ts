import { describe, expect, it } from 'vitest';
import { activeChapterIndex, formatChaptersText, parseChaptersText } from './chapters';

describe('parseChaptersText', () => {
  it('reads mm:ss and h:mm:ss lines', () => {
    expect(parseChaptersText('00:00 المقدمة\n05:30 الشرح\n1:12:00 الخاتمة')).toEqual([
      { seconds: 0, title: 'المقدمة' },
      { seconds: 330, title: 'الشرح' },
      { seconds: 4320, title: 'الخاتمة' },
    ]);
  });
  it('accepts Arabic-Indic digits and separators like "-" and ":"', () => {
    expect(parseChaptersText('٠١:٣٠ - عنوان\n02:00: ثانٍ')).toEqual([
      { seconds: 90, title: 'عنوان' },
      { seconds: 120, title: 'ثانٍ' },
    ]);
  });
  it('sorts by time and skips lines that are not chapters', () => {
    expect(parseChaptersText('10:00 ب\nنص عادي\n01:00 أ\n05:00')).toEqual([
      { seconds: 60, title: 'أ' },
      { seconds: 600, title: 'ب' },
    ]);
  });
  it('returns nothing for empty text', () => {
    expect(parseChaptersText('')).toEqual([]);
  });
});

describe('formatChaptersText', () => {
  it('writes chapters back so that reading them again gives the same chapters', () => {
    const chapters = [
      { seconds: 0, title: 'المقدمة' },
      { seconds: 330, title: 'الشرح' },
      { seconds: 4320, title: 'الخاتمة' },
    ];
    expect(parseChaptersText(formatChaptersText(chapters))).toEqual(chapters);
  });
  it('writes nothing for no chapters', () => {
    expect(formatChaptersText(undefined)).toBe('');
  });
});

describe('activeChapterIndex', () => {
  const chapters = [
    { seconds: 10, title: 'أ' },
    { seconds: 60, title: 'ب' },
  ];
  it('is -1 before the first chapter', () => expect(activeChapterIndex(chapters, 5)).toBe(-1));
  it('is the chapter that has started', () => {
    expect(activeChapterIndex(chapters, 10)).toBe(0);
    expect(activeChapterIndex(chapters, 59)).toBe(0);
    expect(activeChapterIndex(chapters, 60)).toBe(1);
    expect(activeChapterIndex(chapters, 9999)).toBe(1);
  });
});
