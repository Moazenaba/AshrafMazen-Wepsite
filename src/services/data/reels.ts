// The admin's reels settings (order, removed, titles), kept in site_settings under "reels_settings".
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { parseReelsSettings, type ReelsSettings } from '../../lib/reelsRules';

const KEY = 'reels_settings';

export async function getReelsSettings(): Promise<ReelsSettings> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', KEY).maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  return parseReelsSettings(data?.value ?? '{}');
}

export async function saveReelsSettings(settings: ReelsSettings): Promise<void> {
  const { error } = await supabase.from('site_settings').upsert([{ key: KEY, value: JSON.stringify(settings) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
}
