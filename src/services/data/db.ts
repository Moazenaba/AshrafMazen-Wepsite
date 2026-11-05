// Small helpers shared by every data module: turn a Supabase answer into rows or an Arabic error.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';

// The rows of an answer; an error becomes an Error whose message is in Arabic
export function rowsOrThrow<T>(result: { data: T[] | null; error: unknown }): T[] {
  if (result.error) throw new Error(translateSupabaseError(result.error as never));
  return result.data ?? [];
}

// Starts a query over the lessons visitors may see
export const publishedLessons = () => supabase.from('lessons').select('*').eq('status', 'published');
