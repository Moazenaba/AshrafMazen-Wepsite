import { describe, expect, it } from 'vitest';
import { siblingsOf } from './siblings';

const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('siblingsOf (previous and next lesson of a series)', () => {
  it('has a next lesson only at the start', () => {
    expect(siblingsOf(list, 'a')).toEqual({ prevLesson: null, nextLesson: { id: 'b' } });
  });
  it('has both in the middle', () => {
    expect(siblingsOf(list, 'b')).toEqual({ prevLesson: { id: 'a' }, nextLesson: { id: 'c' } });
  });
  it('has a previous lesson only at the end', () => {
    expect(siblingsOf(list, 'c')).toEqual({ prevLesson: { id: 'b' }, nextLesson: null });
  });
  it('has neither when the lesson is not in the list (a draft preview) or the list is empty', () => {
    expect(siblingsOf(list, 'zzz')).toEqual({ prevLesson: null, nextLesson: null });
    expect(siblingsOf([], undefined)).toEqual({ prevLesson: null, nextLesson: null });
  });
});
