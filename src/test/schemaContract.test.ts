import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The columns the code reads or writes, written by hand from src/services/data/*.ts, api/*.ts and scripts/site-data.mjs.
// When docs/schema/tables.json exists (npm run schema), every one of them must exist in the real database.
const USED: Record<string, string[]> = {
  lessons: ['id', 'series_id', 'lesson_number', 'title', 'youtube_url', 'audio_url', 'transcript', 'status', 'published_at', 'created_at', 'views'],
  series: ['id', 'category_id', 'title', 'slug', 'description', 'sort_order'],
  categories: ['id', 'name', 'slug', 'description', 'sort_order', 'color', 'icon'],
  site_settings: ['key', 'value'],
  social_links: ['id', 'platform', 'url', 'sort_order', 'is_active'],
  submissions: ['id', 'kind', 'title', 'url', 'author', 'details', 'target', 'contact', 'status', 'admin_note', 'created_at', 'reviewed_at'],
  admins: ['user_id'],
  content_stats: ['key', 'views'],
  error_events: ['id', 'at', 'source', 'name', 'message', 'detail', 'path'],
};

const FILE = 'docs/schema/tables.json';
const generated = existsSync(FILE);

describe('database contract', () => {
  it.skipIf(!generated)('every table and column the code uses exists (schema file generated)', () => {
    const tables = JSON.parse(readFileSync(FILE, 'utf8')) as Record<string, Record<string, unknown>>;
    const missing: string[] = [];
    for (const [table, columns] of Object.entries(USED)) {
      // error_events comes from a migration the owner may not have run yet
      if (table === 'error_events' && !tables[table]) continue;
      if (!tables[table]) missing.push(table);
      else for (const column of columns) if (!(column in tables[table])) missing.push(`${table}.${column}`);
    }
    expect(missing).toEqual([]);
  });
});
