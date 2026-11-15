// "Who still uses this stored file?" A file may be deleted only when nothing references it. References are compared
// by the file's key in the bucket (fileKey), never by link text: the same file has two link forms.
import { supabase } from '../../lib/supabase';
import { fileKey } from '../../lib/fileLinks';
import { deleteFromR2 } from '../r2';

// The settings that can hold a link to a stored file
const SETTING_KEYS = ['home_feature', 'welcome_sound', 'banner_logo_url', 'lesson_extras', 'library_books', 'youtube_overrides'];

// Every string inside a value, however deeply nested in objects and arrays
export function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsIn);
  return [];
}

// A setting's stored text is JSON, except the logo, which is a plain link
function settingStrings(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  try {
    return stringsIn(JSON.parse(raw));
  } catch {
    return [raw];
  }
}

// The names of the places that reference `key`; throws when the database cannot be read
export async function fileUsers(key: string): Promise<string[]> {
  const [lessons, settings] = await Promise.all([
    supabase.from('lessons').select('id, audio_url'),
    supabase.from('site_settings').select('key, value').in('key', SETTING_KEYS),
  ]);
  if (lessons.error) throw new Error(lessons.error.message);
  if (settings.error) throw new Error(settings.error.message);
  const users: string[] = [];
  for (const row of lessons.data ?? []) if (fileKey(row.audio_url as string) === key) users.push(`lesson:${row.id}`);
  for (const row of settings.data ?? []) {
    if (settingStrings(row.value).some((text) => fileKey(text) === key)) users.push(`setting:${row.key}`);
  }
  return users;
}

// Deletes the stored file behind `url` when nothing else uses it. When unsure (a read failed), the file is kept.
export async function deleteIfUnused(url: string | null | undefined, except?: string): Promise<boolean> {
  const key = fileKey(url);
  if (!key || !url) return false;
  try {
    const users = (await fileUsers(key)).filter((user) => user !== except);
    if (users.length > 0) return false;
  } catch (err) {
    console.error('File usage check failed, the file was kept:', err);
    return false;
  }
  await deleteFromR2(url);
  return true;
}
