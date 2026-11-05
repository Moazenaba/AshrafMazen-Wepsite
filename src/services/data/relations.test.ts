import { describe, expect, it } from 'vitest';
import { category, lesson, series } from '../../test/factories';
import { attachWith } from './relations';

describe('attachWith (a lesson gets its series and category)', () => {
  const seriesList = [series({ id: 's1', category_id: 'c1' }), series({ id: 's2', category_id: 'missing' })];
  const categories = [category({ id: 'c1', name: 'العقيدة' })];

  it('attaches the series and its category', () => {
    const [result] = attachWith([lesson({ series_id: 's1' })], seriesList, categories);
    expect(result.series?.id).toBe('s1');
    expect(result.category?.name).toBe('العقيدة');
  });

  it('gives a null category when the series points to one that does not exist', () => {
    const [result] = attachWith([lesson({ series_id: 's2' })], seriesList, categories);
    expect(result.series?.id).toBe('s2');
    expect(result.category).toBeNull();
  });

  it('gives nulls for a lesson whose series does not exist', () => {
    const [result] = attachWith([lesson({ series_id: 'gone' })], seriesList, categories);
    expect(result.series).toBeNull();
    expect(result.category).toBeNull();
  });

  it("keeps the lessons' own fields and the order of the list", () => {
    const result = attachWith([lesson({ id: 'b', title: 'ب' }), lesson({ id: 'a', title: 'أ' })], seriesList, categories);
    expect(result.map((l) => l.id)).toEqual(['b', 'a']);
    expect(result[0].title).toBe('ب');
  });
});
