// Read-only: asks the database for its own description (PostgREST's OpenAPI at <url>/rest/v1/) and writes the tables and
// columns to docs/schema/tables.json, sorted so the file is stable. Needs the server key; it never prints it.
//   node scripts/dump-schema.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Tables with their columns: { table: { column: { type, format, required, default, primaryKey } } }
export function tablesFrom(openapi) {
  const out = {};
  for (const table of Object.keys(openapi?.definitions ?? {}).sort()) {
    const def = openapi.definitions[table];
    const required = new Set(def.required ?? []);
    out[table] = {};
    for (const column of Object.keys(def.properties ?? {}).sort()) {
      const p = def.properties[column];
      out[table][column] = {
        type: p.type ?? null,
        format: p.format ?? null,
        required: required.has(column),
        default: p.default ?? null,
        primaryKey: String(p.description ?? '').includes('<pk/>'),
      };
    }
  }
  return out;
}

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
}

async function main() {
  loadEnv();
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    console.log('no service key; ask the owner to run `node scripts/dump-schema.mjs`');
    return;
  }
  const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) {
    console.error(`the database answered ${response.status}`);
    process.exit(1);
  }
  const dir = resolve(root, 'docs/schema');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'tables.json'), `${JSON.stringify(tablesFrom(await response.json()), null, 2)}\n`);
  console.log('wrote docs/schema/tables.json');
}

if (process.argv[1] && process.argv[1].endsWith('dump-schema.mjs')) await main();
