import { describe, expect, it } from 'vitest';
import { buildTargets, matchTargets, targetHref } from './featureTargets';

const targets = buildTargets({
  lessons: [{ id: 'l1', title: 'شرح الأربعين النووية' }],
  books: [{ id: 'b1', title: 'كتاب التوحيد' }],
  videos: [{ id: 'v1', title: 'خطبة الجمعة' }, { id: 'v1', title: 'مكررة' }],
});

describe('featureTargets', () => {
  it('gives each kind its own page address', () => {
    expect(targetHref('lesson', 'l1')).toBe('/lesson/l1');
    expect(targetHref('book', 'b1')).toBe('/book/b1');
    expect(targetHref('video', 'v1')).toBe('/video/v1');
  });

  it('lists lessons, books and videos once each', () => {
    expect(targets.map((t) => t.href)).toEqual(['/lesson/l1', '/book/b1', '/video/v1']);
  });

  it('finds by name, ignoring Arabic marks', () => {
    expect(matchTargets(targets, 'التَّوحيد').map((t) => t.id)).toEqual(['b1']);
    expect(matchTargets(targets, 'لا شيء مطابق')).toEqual([]);
  });

  it('shows the first ones when nothing is typed', () => {
    expect(matchTargets(targets, '', 2)).toHaveLength(2);
  });
});
