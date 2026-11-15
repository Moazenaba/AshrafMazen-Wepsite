import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, installFakeDatabase, resetFakeDatabase } from '../../test/fakeDatabase';
import { supabase } from '../../lib/supabase';

const deleteFromR2 = vi.fn(async (_url: string) => {});
vi.mock('../r2', () => ({ deleteFromR2: (u: string) => deleteFromR2(u), isR2Url: () => true }));

import { deleteIfUnused, fileUsers, stringsIn } from './fileUsage';
import { saveLessonExtras } from './extras';

const siteLink = (key: string) => `/api/r2?file=${encodeURIComponent(key)}`;
const setting = (key: string, value: unknown) => {
  const row = db.site_settings.find((r) => r.key === key);
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (row) row.value = text;
  else db.site_settings.push({ key, value: text });
};

beforeEach(() => {
  resetFakeDatabase();
  installFakeDatabase();
  deleteFromR2.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('stringsIn', () => {
  it('returns every string of nested objects and arrays and ignores numbers and null', () => {
    expect(stringsIn({ a: 'x', b: [1, 'y', { c: 'z', d: null }], e: 5 }).sort()).toEqual(['x', 'y', 'z']);
  });
});

describe('fileUsers', () => {
  it('finds a lesson that uses the file, whichever link form is stored (DAT-01)', async () => {
    expect(await fileUsers('audio/lesson-1.mp3')).toEqual(['lesson:lesson-1']);
  });

  it('finds a setting that uses the file', async () => {
    setting('welcome_sound', { enabled: true, url: siteLink('audio/w.mp3'), volume: 0.5 });
    expect(await fileUsers('audio/w.mp3')).toEqual(['setting:welcome_sound']);
  });

  it('reads a plain-link setting such as the logo', async () => {
    expect(await fileUsers('branding/old-logo.png')).toEqual(['setting:banner_logo_url']);
  });
});

describe('deleteIfUnused', () => {
  it('deletes when nobody uses the file', async () => {
    expect(await deleteIfUnused(siteLink('audio/free.mp3'))).toBe(true);
    expect(deleteFromR2).toHaveBeenCalledWith(siteLink('audio/free.mp3'));
  });

  it('keeps the file a setting uses', async () => {
    setting('welcome_sound', { enabled: true, url: siteLink('audio/w.mp3'), volume: 0.5 });
    expect(await deleteIfUnused(siteLink('audio/w.mp3'))).toBe(false);
    expect(deleteFromR2).not.toHaveBeenCalled();
  });

  it('ignores the place named in except', async () => {
    expect(await deleteIfUnused(siteLink('audio/lesson-1.mp3'), 'lesson:lesson-1')).toBe(true);
  });

  it('ignores a link that is not a site file', async () => {
    expect(await deleteIfUnused('https://example.com/a.mp3')).toBe(false);
    expect(deleteFromR2).not.toHaveBeenCalled();
  });

  it('keeps the file when a read fails', async () => {
    (supabase as any).from = () => ({ select: () => ({ in: async () => ({ data: null, error: { message: 'down' } }), then: (r: any) => r({ data: [], error: null }) }) });
    expect(await deleteIfUnused(siteLink('audio/free.mp3'))).toBe(false);
    expect(deleteFromR2).not.toHaveBeenCalled();
  });
});

describe('a lesson picture', () => {
  const picture = () => JSON.parse(db.site_settings.find((r) => r.key === 'lesson_extras')?.value || '{}').images?.['lesson-1'];

  it('deletes the old file when replaced, and none when the same picture is saved again', async () => {
    await saveLessonExtras('lesson-1', { image: siteLink('branding/a.png') });
    deleteFromR2.mockClear();
    await saveLessonExtras('lesson-1', { image: siteLink('branding/a.png') });
    expect(deleteFromR2).not.toHaveBeenCalled();
    await saveLessonExtras('lesson-1', { image: siteLink('branding/b.png') });
    expect(deleteFromR2).toHaveBeenCalledWith(siteLink('branding/a.png'));
    expect(picture()).toBe(siteLink('branding/b.png'));
  });

  it('deletes the file when the picture is removed', async () => {
    await saveLessonExtras('lesson-1', { image: siteLink('branding/a.png') });
    deleteFromR2.mockClear();
    await saveLessonExtras('lesson-1', { image: '' });
    expect(deleteFromR2).toHaveBeenCalledWith(siteLink('branding/a.png'));
  });
});
