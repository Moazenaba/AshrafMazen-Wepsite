import { beforeEach, describe, expect, it } from 'vitest';
import { db, installFakeDatabase, resetFakeDatabase } from '../../test/fakeDatabase';
import { getRecordInfo, levelOf, restorePrevious } from './recordAdmin';

beforeEach(() => {
  resetFakeDatabase();
  installFakeDatabase();
});

const value = (key: string) => db.site_settings.find((r) => r.key === key)?.value;

describe('recordAdmin', () => {
  it('colours by size', () => {
    expect([levelOf(1000), levelOf(650_000), levelOf(950_000)]).toEqual(['ok', 'warn', 'full']);
  });

  it('reports size and count of the saved lists', async () => {
    const info = await getRecordInfo();
    const books = info.find((r) => r.key === 'library_books')!;
    expect(books.items).toBeGreaterThan(0);
    expect(books.hasPrevious).toBe(false);
  });

  it('restores the previous copy and keeps the replaced one as the new previous', async () => {
    db.site_settings.push({ key: 'library_books__prev', value: '[{"id":"old"}]' });
    const current = value('library_books');
    await restorePrevious('library_books');
    expect(value('library_books')).toBe('[{"id":"old"}]');
    expect(value('library_books__prev')).toBe(current);
  });

  it('refuses when there is no previous copy or the key is unknown', async () => {
    await expect(restorePrevious('library_books')).rejects.toThrow('لا توجد نسخة سابقة');
    await expect(restorePrevious('banner_name')).rejects.toThrow();
  });
});
