import { describe, expect, it } from 'vitest';
import { countExisting } from './bookmarkCount';

describe('countExisting', () => {
  it('counts only the ids that still exist', () => {
    expect(countExisting(['a', 'b', 'gone'], new Set(['a', 'b', 'c']))).toBe(2);
  });

  it('counts every id when the known list is not available', () => {
    expect(countExisting(['a', 'b'], null)).toBe(2);
  });

  it('is zero for no bookmarks', () => {
    expect(countExisting([], new Set(['a']))).toBe(0);
  });
});
