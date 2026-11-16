// Replaces every server answer with a fixture so the browser tests need no database, no network and no secrets.
import type { Page, Route } from '@playwright/test';
import { books, categories, draftLesson, lessons, library, liveOff, series, settings, siteBundle } from './data';

type Rows = Record<string, any>[];
export interface Overrides {
  site?: unknown;
  library?: unknown;
  live?: unknown;
  submit?: { status: number; body?: unknown };
  lessons?: Rows;
}

const json = (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', ...headers }, body: JSON.stringify(body) });

// A silent one-second WAV: the only audio the tests ever play
export function silence(): Buffer {
  const rate = 8000;
  const data = Buffer.alloc(rate * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');

// A tiny PostgREST: eq / neq / in / not.is.null filters, order and limit
function table(params: URLSearchParams, rows: Rows): Rows {
  let out = [...rows];
  for (const [column, expr] of params.entries()) {
    if (['select', 'order', 'limit', 'offset'].includes(column)) continue;
    const [op, ...rest] = expr.split('.');
    const value = rest.join('.');
    if (op === 'eq') out = out.filter((r) => String(r[column]) === value);
    else if (op === 'neq') out = out.filter((r) => String(r[column] ?? '') !== value);
    else if (op === 'in') out = out.filter((r) => value.replace(/^\(|\)$/g, '').split(',').includes(String(r[column])));
    else if (op === 'not' && value === 'is.null') out = out.filter((r) => r[column] !== null && r[column] !== undefined);
  }
  const order = params.get('order');
  if (order) {
    const [column, direction] = order.split('.');
    out.sort((a, b) => (String(a[column] ?? '') < String(b[column] ?? '') ? -1 : 1) * (direction === 'desc' ? -1 : 1));
  }
  const limit = Number(params.get('limit'));
  return limit > 0 ? out.slice(0, limit) : out;
}

export function consoleErrors(page: Page): string[] {
  return (page as any).__consoleErrors ?? [];
}

export async function mockServer(page: Page, overrides: Overrides = {}): Promise<void> {
  const errors: string[] = [];
  (page as any).__consoleErrors = errors;
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // A deliberately failing request, or an outside request the test aborted, is not a bug in the site
    if (/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED/.test(text)) return;
    errors.push(text);
  });

  const tables: Record<string, Rows> = {
    lessons: overrides.lessons ?? [...lessons, draftLesson],
    categories,
    series,
    site_settings: settings,
    social_links: [],
    submissions: [],
    admins: [],
  };

  await page.route(/(youtube\.com|ytimg\.com|mp3quran\.net|googlevideo\.com|youtube-nocookie\.com)/, (route) => route.abort());
  await page.route('**/*.supabase.co/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/rpc/published_books')) return json(route, books);
    if (url.pathname.includes('/rpc/')) return json(route, null);
    if (url.pathname.includes('/auth/')) return json(route, { error: 'no auth in tests' }, 401);
    const name = url.pathname.split('/').pop() ?? '';
    const rows = table(url.searchParams, tables[name] ?? []);
    const single = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
    if (single) return rows[0] ? json(route, rows[0]) : json(route, { message: 'no rows', code: 'PGRST116' }, 406);
    return json(route, rows, 200, { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
  });
  await page.route('**/api/site', (route) => json(route, overrides.site ?? siteBundle, overrides.site === 'fail' ? 500 : 200));
  await page.route('**/api/youtube-library**', (route) => json(route, overrides.library ?? library, overrides.library === 'fail' ? 500 : 200));
  await page.route('**/api/live', (route) => json(route, overrides.live ?? liveOff));
  await page.route('**/api/youtube-shorts', (route) => json(route, { updatedAt: null, shorts: [] }));
  await page.route('**/api/log', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/submit', (route) => json(route, overrides.submit?.body ?? { ok: true }, overrides.submit?.status ?? 201));
  await page.route('**/api/r2?**', (route) => {
    if (route.request().url().includes('audio')) return route.fulfill({ status: 200, contentType: 'audio/wav', body: silence() });
    return route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL });
  });
}
