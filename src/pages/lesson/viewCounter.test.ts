import { describe, expect, it, vi } from 'vitest';
import { createOnceCounter } from './viewCounter';

describe('createOnceCounter (a lesson is counted once per visit)', () => {
  it('counts a lesson the first time it is asked', () => {
    const count = vi.fn();
    createOnceCounter(count)('a');
    expect(count).toHaveBeenCalledWith('a');
  });

  it('does not count the same lesson again (a player reports its position many times)', () => {
    const count = vi.fn();
    const once = createOnceCounter(count);
    once('a');
    once('a');
    once('a');
    expect(count).toHaveBeenCalledTimes(1);
  });

  it('counts a different lesson separately', () => {
    const count = vi.fn();
    const once = createOnceCounter(count);
    once('a');
    once('b');
    expect(count.mock.calls.map((c) => c[0])).toEqual(['a', 'b']);
  });
});
