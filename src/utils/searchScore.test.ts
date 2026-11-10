import { describe, expect, it } from 'vitest';
import { searchScore } from './arabicSearch';

const title = 'خطبة الجمعة | النصوص الشرعية بين الفهم الصحيح وسوء التأويل';

describe('searchScore (search by words, not one exact phrase)', () => {
  it('finds a title despite punctuation and letter forms', () => {
    expect(searchScore(title, 'خطبه الجمعة النصوص الشرعيه')).toBeGreaterThan(0);
  });
  it('finds a long search with one extra word in it', () => {
    expect(searchScore(title, 'خطبة الجمعة النصوص الشرعية بين الفهم الصحيح وسوء التأويل حفظ')).toBeGreaterThan(0);
  });
  it('accepts words in any order', () => {
    expect(searchScore(title, 'التأويل النصوص')).toBeGreaterThan(0);
  });
  it('rejects a short search whose words are not all there', () => {
    expect(searchScore(title, 'النصوص الفقه')).toBe(0);
    expect(searchScore(title, '')).toBe(0);
  });
  it('ranks the exact phrase above scattered words', () => {
    expect(searchScore(title, 'الفهم الصحيح')).toBeGreaterThan(searchScore('الصحيح في الفهم', 'الفهم الصحيح'));
  });
});
