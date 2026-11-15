import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, installFakeDatabase, resetFakeDatabase } from '../../test/fakeDatabase';

vi.mock('../r2', () => ({ deleteFromR2: vi.fn(), isR2Url: () => false, uploadToR2: vi.fn(), r2DownloadUrl: (u: string) => u }));
vi.mock('../../lib/reportError', () => ({ reportError: vi.fn() }));

import { createBook, deleteBook, getAllBooksAdmin } from './books';
import { saveLessonExtras } from './extras';
import { readYoutubeOverrides } from './youtube';

const value = (key: string) => db.site_settings.find((r) => r.key === key)?.value;
const book = (id: string) => ({ id, title: `كتاب ${id}`, file_url: '/api/r2?file=library%2Ffiles%2Fa.pdf', status: 'published' });

beforeEach(() => {
  resetFakeDatabase();
  installFakeDatabase();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('library_books', () => {
  it('a normal save keeps the old value under library_books__prev', async () => {
    const before = value('library_books');
    await createBook(book('b-new') as never);
    expect(value('library_books__prev')).toBe(before);
    expect(JSON.parse(value('library_books')).some((b: { id: string }) => b.id === 'b-new')).toBe(true);
  });

  it('a broken stored value makes reading throw and saving impossible', async () => {
    db.site_settings.find((r) => r.key === 'library_books')!.value = '{broken';
    await expect(getAllBooksAdmin()).rejects.toThrow('تعذّرت قراءة البيانات المحفوظة');
    await expect(createBook(book('x') as never)).rejects.toThrow('تعذّرت قراءة البيانات المحفوظة');
    expect(value('library_books')).toBe('{broken');
  });

  it('deleting the only book is allowed', async () => {
    db.site_settings.find((r) => r.key === 'library_books')!.value = JSON.stringify([book('only')]);
    await deleteBook(book('only') as never);
    expect(JSON.parse(value('library_books'))).toEqual([]);
  });
});

describe('lesson_extras', () => {
  it('a save keeps the previous copy, and a broken value is never overwritten', async () => {
    await saveLessonExtras('lesson-1', { featured: true });
    await saveLessonExtras('lesson-1', { image: 'https://x.test/a.jpg' });
    expect(JSON.parse(value('lesson_extras__prev')).featured).toContain('lesson-1');
    db.site_settings.find((r) => r.key === 'lesson_extras')!.value = '[1,2]';
    await expect(saveLessonExtras('lesson-1', { featured: false })).rejects.toThrow('تعذّرت قراءة البيانات المحفوظة');
    expect(value('lesson_extras')).toBe('[1,2]');
  });
});

describe('youtube_overrides', () => {
  it('reading a broken value throws instead of returning defaults', async () => {
    db.site_settings.push({ key: 'youtube_overrides', value: '{broken' });
    await expect(readYoutubeOverrides()).rejects.toThrow('تعذّرت قراءة البيانات المحفوظة');
  });
});
