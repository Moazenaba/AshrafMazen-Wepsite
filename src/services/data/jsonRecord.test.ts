import { describe, expect, it } from 'vitest';
import { CONFLICT_MESSAGE, updateRecord, type RecordStore } from './jsonRecord';

// An in-memory store with the same rule as the database function: write only if the value is unchanged
function memoryStore(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set('k', initial);
  const store: RecordStore & { values: Map<string, string>; beforeWrite?: () => void; writes: number } = {
    values,
    writes: 0,
    async read(key) {
      return values.get(key) ?? null;
    },
    async writeIfUnchanged(key, previous, next) {
      store.beforeWrite?.();
      store.beforeWrite = undefined;
      if ((values.get(key) ?? null) !== previous) return false;
      values.set(key, next);
      store.writes++;
      return true;
    },
  };
  return store;
}

const parse = (raw: string | null): string[] => (raw ? JSON.parse(raw) : []);
const add = (item: string) => (list: string[]) => [...list, item];

describe('updateRecord (saving a shared JSON record without losing anyone\'s edit)', () => {
  it('applies the change to the saved copy and writes it', async () => {
    const store = memoryStore('["a"]');
    const result = await updateRecord(store, 'k', parse, add('b'));
    expect(result).toEqual(['a', 'b']);
    expect(JSON.parse(store.values.get('k')!)).toEqual(['a', 'b']);
  });

  it('creates the record when it does not exist yet', async () => {
    const store = memoryStore();
    await updateRecord(store, 'k', parse, add('a'));
    expect(JSON.parse(store.values.get('k')!)).toEqual(['a']);
  });

  it('keeps both edits when another admin saves between the read and the write', async () => {
    const store = memoryStore('["a"]');
    // the other admin saves "x" just before this admin's first write is checked
    store.beforeWrite = () => store.values.set('k', '["a","x"]');
    const result = await updateRecord(store, 'k', parse, add('b'));
    expect(result).toEqual(['a', 'x', 'b']);
    expect(JSON.parse(store.values.get('k')!)).toEqual(['a', 'x', 'b']);
  });

  it('applies the change again to the newer copy, never to the stale one', async () => {
    const store = memoryStore('["a"]');
    store.beforeWrite = () => store.values.set('k', '[]');
    const seen: string[][] = [];
    await updateRecord(store, 'k', parse, (list) => {
      seen.push([...list]);
      return [...list, 'b'];
    });
    expect(seen).toEqual([['a'], []]);
  });

  it('gives up with a clear message after repeated conflicts, writing nothing', async () => {
    const store = memoryStore('["a"]');
    store.writeIfUnchanged = async () => false;
    await expect(updateRecord(store, 'k', parse, add('b'), 3)).rejects.toThrow(CONFLICT_MESSAGE);
    expect(store.values.get('k')).toBe('["a"]');
  });

  it('does not write when the change itself refuses (for example a book that no longer exists)', async () => {
    const store = memoryStore('["a"]');
    await expect(
      updateRecord(store, 'k', parse, () => {
        throw new Error('هذا الكتاب لم يعد موجوداً.');
      })
    ).rejects.toThrow('لم يعد موجوداً');
    expect(store.writes).toBe(0);
  });
});
