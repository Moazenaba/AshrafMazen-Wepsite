import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, installFakeDatabase, resetFakeDatabase } from '../../test/fakeDatabase';

vi.mock('../r2', () => ({ deleteFromR2: vi.fn(), isR2Url: () => false }));

import { createCategory, createSeries, updateCategory, updateSeries } from './catalogAdmin';

beforeEach(() => {
  resetFakeDatabase();
  installFakeDatabase();
});

describe('slugs are unique', () => {
  it('refuses a new category with a slug that is taken', async () => {
    await expect(createCategory({ name: 'اسم آخر', slug: 'aqeedah' })).rejects.toThrow('مستخدم من قبل');
    expect(db.categories).toHaveLength(3);
  });

  it('creates a category with a free slug', async () => {
    const created = await createCategory({ name: 'الفقه', slug: 'fiqh' });
    expect(created.slug).toBe('fiqh');
  });

  it('lets a category keep its own slug when edited, but not take another one', async () => {
    await expect(updateCategory('cat-aqeedah', { slug: 'aqeedah', name: 'العقيدة' })).resolves.toBeTruthy();
    await expect(updateCategory('cat-aqeedah', { slug: 'khutab' })).rejects.toThrow('مستخدم من قبل');
  });

  it('refuses a new series with a taken slug and an update onto another series slug', async () => {
    await expect(createSeries({ title: 'x', category_id: 'cat-aqeedah', slug: 'usul' })).rejects.toThrow('مستخدم من قبل');
    await expect(updateSeries('series-empty', { slug: 'usul' })).rejects.toThrow('مستخدم من قبل');
    await expect(updateSeries('series-1', { slug: 'usul' })).resolves.toBeTruthy();
  });
});
