// Turns docs/schema/tables.json into docs/schema/schema.sql (create table if not exists ...).
//   node scripts/schema-to-sql.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SQL_TYPE = { integer: 'integer', bigint: 'bigint', number: 'numeric', boolean: 'boolean', string: 'text', object: 'jsonb', array: 'jsonb' };
const sqlType = (c) => (c.format && !/^(integer|bigint|text|boolean)$/.test(c.format) ? c.format.replace(/ without time zone/, '') : SQL_TYPE[c.type] ?? c.format ?? 'text');

export function toSql(tables, date) {
  const lines = [`-- Generated from the live database on ${date}. Indexes, foreign keys, functions and policies are in docs/migrations/.`, ''];
  for (const [table, columns] of Object.entries(tables)) {
    const pk = Object.entries(columns).filter(([, c]) => c.primaryKey).map(([name]) => name);
    const body = Object.entries(columns).map(([name, c]) => {
      const notNull = c.required ? ' not null' : '';
      const def = c.default !== null && c.default !== undefined ? ` default ${typeof c.default === 'string' && !/\(|^now|^true|^false|^\d/.test(c.default) ? `'${c.default}'` : c.default}` : '';
      return `  ${name} ${sqlType(c)}${notNull}${def}`;
    });
    if (pk.length) body.push(`  primary key (${pk.join(', ')})`);
    lines.push(`create table if not exists public.${table} (`, body.join(',\n'), ');', '');
  }
  return lines.join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('schema-to-sql.mjs')) {
  const file = resolve(root, 'docs/schema/tables.json');
  if (!existsSync(file)) {
    console.log('docs/schema/tables.json does not exist yet; run scripts/dump-schema.mjs first');
  } else {
    writeFileSync(resolve(root, 'docs/schema/schema.sql'), toSql(JSON.parse(readFileSync(file, 'utf8')), new Date().toISOString().slice(0, 10)));
    console.log('wrote docs/schema/schema.sql');
  }
}
