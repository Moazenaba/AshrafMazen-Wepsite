import { describe, expect, it } from 'vitest';
import { canMoveId, moveId, pinnedOrder } from './featuredOrder';

describe('featured order', () => {
  it('swaps an item with the one above or below it', () => {
    expect(moveId(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveId(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('does not move past the ends, nor an unknown id', () => {
    expect(moveId(['a', 'b'], 'a', -1)).toEqual(['a', 'b']);
    expect(moveId(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
    expect(moveId(['a', 'b'], 'x', 1)).toEqual(['a', 'b']);
    expect(canMoveId(['a', 'b'], 'a', -1)).toBe(false);
    expect(canMoveId(['a', 'b'], 'a', 1)).toBe(true);
  });

  it('keeps only lessons still pinned, in their saved order, and adds new pins at the end', () => {
    expect(pinnedOrder(['c', 'x', 'a'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
  });
});
