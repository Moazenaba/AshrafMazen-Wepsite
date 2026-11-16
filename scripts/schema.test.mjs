import { describe, expect, it } from 'vitest';
import { tablesFrom } from './dump-schema.mjs';
import { toSql } from './schema-to-sql.mjs';

const openapi = {
  definitions: {
    lessons: {
      required: ['id', 'title'],
      properties: {
        title: { type: 'string', format: 'text' },
        id: { type: 'string', format: 'uuid', description: 'Note:\nThis is a Primary Key.<pk/>', default: 'gen_random_uuid()' },
        views: { type: 'integer', format: 'integer', default: 0 },
      },
    },
    admins: { properties: { user_id: { type: 'string', format: 'uuid', description: '<pk/>' } }, required: ['user_id'] },
  },
};

describe('tablesFrom', () => {
  it('sorts tables and columns and reads required, default and the primary key', () => {
    const tables = tablesFrom(openapi);
    expect(Object.keys(tables)).toEqual(['admins', 'lessons']);
    expect(Object.keys(tables.lessons)).toEqual(['id', 'title', 'views']);
    expect(tables.lessons.id).toMatchObject({ primaryKey: true, required: true, format: 'uuid' });
    expect(tables.lessons.views.default).toBe(0);
  });

  it('gives an empty result for an empty description', () => {
    expect(tablesFrom({})).toEqual({});
  });
});

describe('toSql', () => {
  it('writes a create table with types, not null, defaults and the primary key', () => {
    const sql = toSql(tablesFrom(openapi), '2026-11-15');
    expect(sql).toContain('-- Generated from the live database on 2026-11-15.');
    expect(sql).toContain('create table if not exists public.lessons (');
    expect(sql).toContain('id uuid not null default gen_random_uuid()');
    expect(sql).toContain('views integer default 0');
    expect(sql).toContain('primary key (id)');
  });
});
