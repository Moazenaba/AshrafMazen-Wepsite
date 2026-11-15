// One logger for the server functions. Every event is one JSON line in the Vercel log; an 'error' is also kept in the
// site's own table (error_events), because Vercel keeps logs for one hour only. Logging never throws and never waits long.
import { fetchWithTimeout } from './_fetch.js'; // Node on Vercel needs the extension

export type Level = 'info' | 'warn' | 'error';
export type Source = 'function' | 'browser' | 'csp' | 'monitor';

const SECRET_KEY = /key|token|secret|password|authorization/i;

function cleanDetail(detail: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(detail ?? {})) if (!SECRET_KEY.test(name)) out[name] = value;
  const text = JSON.stringify(out);
  return text.length > 2000 ? { truncated: text.slice(0, 2000) } : out;
}

export async function logEvent(
  level: Level,
  name: string,
  message: string,
  detail?: Record<string, unknown>,
  extra: { source?: Source; path?: string } = {}
): Promise<void> {
  const text = String(message ?? '').slice(0, 500);
  const clean = cleanDetail(detail);
  try {
    console[level](JSON.stringify({ level, fn: name, msg: text, ...clean, at: new Date().toISOString() }));
  } catch {
    // a log line must never break the function
  }
  if (level !== 'error') return;
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return;
  try {
    await fetchWithTimeout(
      `${url}/rest/v1/error_events`,
      {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ source: extra.source ?? 'function', name: name.slice(0, 100), message: text, detail: clean, path: String(extra.path ?? '').slice(0, 300) }),
      },
      3000
    );
  } catch {
    // only the console line is kept
  }
}
