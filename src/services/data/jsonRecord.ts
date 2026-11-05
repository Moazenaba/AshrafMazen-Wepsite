// A JSON record in site_settings that several admins may edit at once (the books, the lesson extras).
// A change is applied to the latest saved copy and written only if nobody saved in between; otherwise it is applied
// again to the newer copy, so no one's edit is lost.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';

export interface RecordStore {
  read(key: string): Promise<string | null>;
  // Writes `next` only if the stored value is still `previous` (null = the record does not exist yet).
  // Returns false when someone else saved first.
  writeIfUnchanged(key: string, previous: string | null, next: string): Promise<boolean>;
}

export const CONFLICT_MESSAGE = 'تعذّر الحفظ لأن مديراً آخر عدّل نفس البيانات في نفس اللحظة. أعد المحاولة.';

// Reads the record, applies `mutate` to what was read, and saves; repeats on a conflict
export async function updateRecord<T>(
  store: RecordStore,
  key: string,
  parse: (raw: string | null) => T,
  mutate: (current: T) => T,
  attempts = 5
): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const raw = await store.read(key);
    const next = mutate(parse(raw));
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

export const updateSiteRecord = <T>(key: string, parse: (raw: string | null) => T, mutate: (current: T) => T) =>
  updateRecord(supabaseRecordStore, key, parse, mutate);
