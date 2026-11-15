// The three big JSON records in site_settings, seen from the admin: their size, how many items they hold, and the
// one-step undo (the copy kept under <key>__prev before every save).
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { MAX_RECORD_BYTES, WARN_RECORD_BYTES } from './jsonRecord';

export const RECORDS = [
  { key: 'library_books', label: 'المكتبة (الكتب)' },
  { key: 'lesson_extras', label: 'الدروس المميزة والفصول والصور' },
  { key: 'youtube_overrides', label: 'إعدادات فيديوهات القناة' },
] as const;

export interface RecordInfo {
  key: string;
  label: string;
  bytes: number;
  items: number | null;
  hasPrevious: boolean;
  level: 'ok' | 'warn' | 'full';
}

export const levelOf = (bytes: number): RecordInfo['level'] => (bytes > MAX_RECORD_BYTES ? 'full' : bytes > WARN_RECORD_BYTES ? 'warn' : 'ok');

function countOf(raw: string | undefined): number | null {
  try {
    const parsed = JSON.parse(raw ?? 'null');
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length;
  } catch {
    // an unreadable value has no count
  }
  return null;
}

export async function getRecordInfo(): Promise<RecordInfo[]> {
  const keys = RECORDS.flatMap((r) => [r.key, `${r.key}__prev`]);
  const { data, error } = await supabase.from('site_settings').select('key, value').in('key', keys);
  if (error) throw new Error(translateSupabaseError(error));
  const byKey = new Map((data ?? []).map((row) => [row.key as string, (row.value ?? '') as string]));
  return RECORDS.map(({ key, label }) => {
    const raw = byKey.get(key);
    const bytes = new Blob([raw ?? '']).size;
    return { key, label, bytes, items: raw === undefined ? 0 : countOf(raw), hasPrevious: byKey.has(`${key}__prev`), level: levelOf(bytes) };
  });
}

// Puts the previous copy back, and keeps the copy it replaces as the new "previous" (so the undo can be undone)
export async function restorePrevious(key: string): Promise<void> {
  if (!RECORDS.some((r) => r.key === key)) throw new Error('سجل غير معروف.');
  const { data, error } = await supabase.from('site_settings').select('key, value').in('key', [key, `${key}__prev`]);
  if (error) throw new Error(translateSupabaseError(error));
  const current = data?.find((r) => r.key === key)?.value as string | undefined;
  const previous = data?.find((r) => r.key === `${key}__prev`)?.value as string | undefined;
  if (previous === undefined) throw new Error('لا توجد نسخة سابقة لهذا السجل.');
  const rows = [{ key, value: previous }, ...(current !== undefined ? [{ key: `${key}__prev`, value: current }] : [])];
  const result = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (result.error) throw new Error(translateSupabaseError(result.error));
}
