// The site's own error log (table error_events, readable by admins only; the server functions write to it).
import { supabase } from '../../lib/supabase';

export interface ErrorEvent {
  id: number;
  at: string;
  source: 'function' | 'browser' | 'csp' | 'monitor';
  name: string;
  message: string;
  path: string;
}

// The table does not exist until the owner runs docs/migrations/2026-11-16-error-events.sql
export class ErrorLogMissingError extends Error {}

const isMissingTable = (error: { code?: string; message?: string }) =>
  error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message || '');

export async function getErrorEvents(limit = 50): Promise<ErrorEvent[]> {
  const { data, error } = await supabase.from('error_events').select('id, at, source, name, message, path').order('at', { ascending: false }).limit(limit);
  if (error) {
    if (isMissingTable(error)) throw new ErrorLogMissingError('missing');
    throw new Error(error.message);
  }
  return (data ?? []) as ErrorEvent[];
}

export async function clearErrorEvents(): Promise<void> {
  const { error } = await supabase.from('error_events').delete().gte('id', 0);
  if (error) throw new Error(error.message);
}
