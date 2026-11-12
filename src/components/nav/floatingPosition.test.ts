import { describe, expect, it } from 'vitest';
import { BOTTOM_GAP, DEFAULT_POSITION, TOP_GAP, parsePosition, settle, topOf } from './floatingPosition';

const W = 390;
const H = 800;
const S = 56;

describe('floating menu position', () => {
  it('sticks to the nearer edge', () => {
    expect(settle(50, 400, W, H, S).side).toBe('left');
    expect(settle(300, 400, W, H, S).side).toBe('right');
  });

  it('never leaves the free area, even dragged past the top or bottom', () => {
    expect(topOf(settle(300, -500, W, H, S), H, S)).toBe(TOP_GAP);
    expect(topOf(settle(300, 5000, W, H, S), H, S)).toBe(H - BOTTOM_GAP - S);
  });

  it('comes back to the same height after a drag', () => {
    const p = settle(300, 400, W, H, S);
    expect(topOf(p, H, S) + S / 2).toBeCloseTo(400);
  });

  it('reads a stored position, or starts at the bottom right corner', () => {
    expect(parsePosition(JSON.stringify({ side: 'left', y: 0.4 }))).toEqual({ side: 'left', y: 0.4 });
    expect(parsePosition('nonsense')).toEqual(DEFAULT_POSITION);
    expect(parsePosition(null)).toEqual(DEFAULT_POSITION);
    expect(parsePosition(JSON.stringify({ side: 'up', y: 2 }))).toEqual(DEFAULT_POSITION);
  });
});
