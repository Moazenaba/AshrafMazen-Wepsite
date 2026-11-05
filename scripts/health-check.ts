// Checks that the site's back end is healthy, from the command line:  npm run health
// Reads .env.local (or the real environment). Exits with 1 if anything essential fails, so it can run in CI too.
//
//   - the settings are present
//   - the database answers, and the public tables are readable
//   - the protected tables are NOT readable with the public key (admin_users, submissions, analytics)
//   - visitors cannot write requests or draft books directly (requests go through api/submit only)
//   - Cloudflare R2: a file can be written, read back and removed
import { existsSync, readFileSync } from 'node:fs';
import { presign, r2Config } from '../api/_r2';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

let failures = 0;
let warnings = 0;
const report = (ok: boolean | 'warn', name: string, detail = '') => {
  const mark = ok === true ? 'PASS' : ok === 'warn' ? 'WARN' : 'FAIL';
  if (ok === false) failures += 1;
  if (ok === 'warn') warnings += 1;
  console.log(`${mark}  ${name}${detail ? `  (${detail})` : ''}`);
};

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
report(!!url && !!anon, 'Supabase settings present');

const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' };
const rest = (path: string, init: RequestInit = {}) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });

async function database() {
  for (const table of ['categories', 'series', 'lessons', 'site_settings', 'social_links']) {
    const response = await rest(`${table}?select=*&limit=1`);
    report(response.ok, `public read: ${table}`, response.ok ? '' : `HTTP ${response.status}`);
  }
}

// Anything that is not a plain "no rows / no access" answer to the public key is a leak
async function protectedTables() {
  for (const table of ['admin_users', 'submissions', 'daily_stats', 'daily_visitors', 'visitor_pings', 'admins']) {
    const response = await rest(`${table}?select=*&limit=1`);
    let rows = -1;
    if (response.ok) rows = ((await response.json()) as unknown[]).length;
    report(!response.ok || rows === 0, `protected from visitors: ${table}`, response.ok ? `${rows} rows visible` : 'blocked');
  }
}

async function contributions() {
  // A row with no title can never be saved, so this writes nothing either way. Permissions are checked before the
  // "title is required" rule, so the error tells which one stopped it: 42501 = visitors are blocked (good).
  const direct = await rest('submissions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ kind: 'correction', title: null }),
  });
  const directCode = direct.ok ? 'saved' : ((await direct.json().catch(() => ({}))) as { code?: string }).code || `HTTP ${direct.status}`;
  report(directCode === '42501', 'visitors cannot add requests directly (only through api/submit)', directCode === '42501' ? 'refused' : `${directCode}: run docs/migrations/2026-11-05-security.sql`);

  const library = await rest('site_settings?select=key&key=eq.library_books');
  const libraryRows = library.ok ? ((await library.json()) as unknown[]).length : 0;
  report(libraryRows === 0, 'draft books are hidden from visitors', libraryRows === 0 ? '' : 'the library record is readable: run docs/migrations/2026-11-05-security.sql');
  const books = await rest('rpc/published_books', { method: 'POST', body: '{}' });
  report(books.ok, 'visitors can list the published books', books.ok ? '' : `HTTP ${books.status}`);

  const approve = await rest('submissions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ kind: 'correction', title: 'health check approved', status: 'approved' }),
  });
  report(!approve.ok, 'a visitor cannot approve their own request', approve.ok ? 'IT WAS ACCEPTED' : 'refused');
  const counters = await rest('rpc/record_event', {
    method: 'POST',
    body: JSON.stringify({ p_kind: 'video', p_key: 'evil; drop', p_seconds: 1, p_view: false }),
  });
  report(!counters.ok, 'statistics refuse invalid input', counters.ok ? 'IT WAS ACCEPTED' : 'refused');
}

async function storage() {
  const cfg = r2Config();
  if (!cfg) return report(false, 'Cloudflare R2 settings present', 'R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  report(true, 'Cloudflare R2 settings present');
  const key = `setup-check/health-${Date.now()}.txt`;
  const put = await fetch(presign(cfg, 'PUT', key, 60), { method: 'PUT', body: 'ok', headers: { 'Content-Type': 'text/plain' } });
  report(put.ok, 'R2: write', put.ok ? '' : `HTTP ${put.status}`);
  const get = await fetch(presign(cfg, 'GET', key, 60));
  report(get.ok && (await get.text()) === 'ok', 'R2: read back', get.ok ? '' : `HTTP ${get.status}`);
  const del = await fetch(presign(cfg, 'DELETE', key, 60), { method: 'DELETE' });
  report(del.ok, 'R2: delete', del.ok ? '' : `HTTP ${del.status}`);
  report(cfg.publicUrl ? 'warn' : true, 'R2: bucket access', cfg.publicUrl ? 'has a public address; files are public' : 'private; served through /api/r2');
}

try {
  if (url && anon) {
    await database();
    await protectedTables();
    await contributions();
  }
  await storage();
} catch (err) {
  report(false, 'health check crashed', (err as Error).message);
}

console.log(`\n${failures === 0 ? 'HEALTHY' : 'PROBLEMS FOUND'}: ${failures} failure(s), ${warnings} warning(s).`);
process.exit(failures === 0 ? 0 : 1);
