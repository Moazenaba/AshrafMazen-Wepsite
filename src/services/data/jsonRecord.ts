// A JSON record in site_settings that several admins may edit at once (the books, the lesson extras).
// A change is applied to the latest saved copy and written only if nobody saved in between; otherwise it is applied
// again to the newer copy, so no one's edit is lost.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { reportError } from '../../lib/reportError';

export interface RecordStore {
  read(key: string): Promise<string | null>;
  // Writes `next` only if the stored value is still `previous` (null = the record does not exist yet).
  // Returns false when someone else saved first.
  writeIfUnchanged(key: string, previous: string | null, next: string): Promise<boolean>;
}

export const MAX_RECORD_BYTES = 900_000;
export const WARN_RECORD_BYTES = 600_000;

export const brokenRecordMessage = (key: string) => `تعذّرت قراءة البيانات المحفوظة (${key}). لم يتم تغيير شيء.`;

// Parses a stored list; a broken or wrong-shaped value gives { ok: false } instead of an empty list
export function readRecord<T>(raw: string | null, isItem: (x: unknown) => x is T): { ok: true; items: T[] } | { ok: false; reason: string } {
  if (raw === null || raw.trim() === '') return { ok: true, items: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not JSON' };
  }
  if (!Array.isArray(parsed)) return { ok: false, reason: 'not a list' };
  if (!parsed.every(isItem)) return { ok: false, reason: 'an item has the wrong shape' };
  return { ok: true, items: parsed };
}

// Refuses a write that would damage the list: an item of the wrong shape, a value over the size limit, or (unless
// allowShrink) a list that lost more than half its items in one save. Returns the reason, or null when the write is fine.
export function checkWrite<T>(before: T[], after: T[], isItem: (x: unknown) => x is T, allowShrink = false): string | null {
  if (!after.every(isItem)) return 'عنصر في القائمة غير صالح. لم يتم الحفظ.';
  if (JSON.stringify(after).length > MAX_RECORD_BYTES) return 'حجم البيانات تجاوز الحد المسموح. لم يتم الحفظ.';
  if (!allowShrink && before.length >= 2 && after.length < before.length / 2) {
    return `هذا الحفظ سيحذف أكثر من نصف العناصر (${before.length} ← ${after.length}). لم يتم الحفظ؛ إن كان مقصوداً فاحذفها واحداً واحداً.`;
  }
  return null;
}

// What a stored record must look like to be edited at all: a present value that is not JSON of that shape is never
// treated as empty (the next save would then erase everything that is in it)
export type RecordShape = 'array' | 'object';
export function assertReadable(key: string, raw: string | null, shape: RecordShape): void {
  if (raw === null || raw.trim() === '') return;
  let ok = false;
  try {
    const parsed = JSON.parse(raw);
    ok = shape === 'array' ? Array.isArray(parsed) : !!parsed && typeof parsed === 'object' && !Array.isArray(parsed);
  } catch {
    ok = false;
  }
  if (!ok) {
    reportError('record-broken', new Error(`${key} is not a valid ${shape}`), { key });
    throw new Error(brokenRecordMessage(key));
  }
}

export interface RecordOptions {
  shape?: RecordShape;
  // Single-item deletes may empty a list
  allowShrink?: boolean;
  // The shape of one item of a list record
  isItem?: (x: unknown) => boolean;
}

export const CONFLICT_MESSAGE = 'تعذّر الحفظ لأن مديراً آخر عدّل نفس البيانات في نفس اللحظة. أعد المحاولة.';

// Reads the record, applies `mutate` to what was read, and saves; repeats on a conflict
export async function updateRecord<T>(
  store: RecordStore,
  key: string,
  parse: (raw: string | null) => T,
  mutate: (current: T) => T,
  options: RecordOptions = {},
  attempts = 5
): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const raw = await store.read(key);
    if (options.shape) assertReadable(key, raw, options.shape);
    const current = parse(raw);
    const next = mutate(current);
    if (Array.isArray(current) && Array.isArray(next)) {
      const problem = checkWrite(current, next, (x): x is unknown => (options.isItem ? options.isItem(x) : true), options.allowShrink);
      if (problem) throw new Error(problem);
    } else if (JSON.stringify(next).length > MAX_RECORD_BYTES) {
      throw new Error('حجم البيانات تجاوز الحد المسموح. لم يتم الحفظ.');
    }
    if (await store.writeIfUnchanged(key, raw, JSON.stringify(next))) return next;
  }
  throw new Error(CONFLICT_MESSAGE);
}

const isMissingFunction = (error: { code?: string; message?: string }) =>
  error.code === 'PGRST202' || error.code === '42883' || /could not find the function/i.test(error.message || '');

export const supabaseRecordStore: RecordStore = {
  async read(key) {
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
    if (error) throw new Error(translateSupabaseError(error));
    return data?.value ?? null;
  },

  async writeIfUnchanged(key, previous, next) {
    // The copy being replaced is kept under <key>__prev, a one-step undo (a failure here never blocks the save)
    if (previous !== null && !key.endsWith('__prev')) {
      await supabase.from('site_settings').upsert([{ key: `${key}__prev`, value: previous }], { onConflict: 'key' });
    }
    // The comparison happens inside the database (docs/migrations/2026-11-05-concurrent-saves.sql)
    const { data, error } = await supabase.rpc('save_setting_if_unchanged', { p_key: key, p_previous: previous, p_next: next });
    if (!error) return data === true;
    if (!isMissingFunction(error)) throw new Error(translateSupabaseError(error));
    // Before that migration has run: a plain write, as it always was
    const plain = await supabase.from('site_settings').upsert([{ key, value: next }], { onConflict: 'key' });
    if (plain.error) throw new Error(translateSupabaseError(plain.error));
    return true;
  },
};

export const updateSiteRecord = <T>(key: string, parse: (raw: string | null) => T, mutate: (current: T) => T, options?: RecordOptions) =>
  updateRecord(supabaseRecordStore, key, parse, mutate, options);
