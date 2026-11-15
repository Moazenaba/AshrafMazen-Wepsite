import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertReadable, brokenRecordMessage, checkWrite, MAX_RECORD_BYTES, readRecord, updateRecord, type RecordStore } from './jsonRecord';

vi.mock('../../lib/reportError', () => ({ reportError: vi.fn() }));

const isItem = (x: unknown): x is { id: string } => !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string';
const list = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `i${i}` }));

describe('readRecord', () => {
  it('reads a valid list and an empty record', () => {
    expect(readRecord(JSON.stringify(list(2)), isItem)).toEqual({ ok: true, items: list(2) });
    expect(readRecord(null, isItem)).toEqual({ ok: true, items: [] });
  });

  it('is not ok for broken JSON, a non-list, and an item of the wrong shape', () => {
    expect(readRecord('{broken', isItem).ok).toBe(false);
    expect(readRecord('{"a":1}', isItem).ok).toBe(false);
    expect(readRecord('[{"id":1}]', isItem).ok).toBe(false);
  });
});

describe('checkWrite', () => {
  it('refuses a shrink from 10 to 4 but allows 10 to 9', () => {
    expect(checkWrite(list(10), list(4), isItem)).not.toBeNull();
    expect(checkWrite(list(10), list(9), isItem)).toBeNull();
  });

  it('allows 10 to 4 with allowShrink', () => {
    expect(checkWrite(list(10), list(4), isItem, true)).toBeNull();
  });

  it('refuses an item of the wrong shape and an oversize value', () => {
    expect(checkWrite(list(2), [{ id: 'a' }, { nope: 1 } as never], isItem)).not.toBeNull();
    const big = [{ id: 'a', text: 'x'.repeat(MAX_RECORD_BYTES) }];
    expect(checkWrite([], big, isItem)).not.toBeNull();
  });
});

describe('assertReadable', () => {
  it('throws the message for a broken value and accepts an absent one', () => {
    expect(() => assertReadable('library_books', '{broken', 'array')).toThrow(brokenRecordMessage('library_books'));
    expect(() => assertReadable('library_books', '{"a":1}', 'array')).toThrow();
    expect(() => assertReadable('x', null, 'object')).not.toThrow();
    expect(() => assertReadable('x', '{"a":1}', 'object')).not.toThrow();
  });
});

describe('updateRecord with guards', () => {
  let stored: string | null;
  const store: RecordStore = {
    read: async () => stored,
    writeIfUnchanged: async (_k, _p, next) => {
      stored = next;
      return true;
    },
  };
  const parse = (raw: string | null) => (raw ? JSON.parse(raw) : []);

  beforeEach(() => {
    stored = null;
  });

  it('never saves over a broken stored value', async () => {
    stored = '{broken';
    await expect(updateRecord(store, 'k', parse, (l: unknown[]) => [...l, { id: 'a' }], { shape: 'array' })).rejects.toThrow(brokenRecordMessage('k'));
    expect(stored).toBe('{broken');
  });

  it('refuses a save that drops most of the list, unless a single delete asks for it', async () => {
    stored = JSON.stringify(list(10));
    await expect(updateRecord(store, 'k', parse, () => list(2), { shape: 'array' })).rejects.toThrow();
    expect(JSON.parse(stored!)).toHaveLength(10);
    await updateRecord(store, 'k', parse, () => list(2), { shape: 'array', allowShrink: true });
    expect(JSON.parse(stored!)).toHaveLength(2);
  });
});
