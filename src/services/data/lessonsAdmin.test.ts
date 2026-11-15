import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, installFakeDatabase, resetFakeDatabase } from '../../test/fakeDatabase';

const deleted: string[] = [];
vi.mock('../r2', () => ({
  isR2Url: (u: string) => u.startsWith('/api/r2?file='),
  deleteFromR2: vi.fn(async (u: string) => {
    deleted.push(u);
  }),
}));

import { createLesson, deleteLesson, updateLesson } from './lessonsAdmin';

const extras = () => JSON.parse(db.site_settings.find((r) => r.key === 'lesson_extras')?.value || '{"featured":[],"chapters":{},"images":{}}');

beforeEach(() => {
  resetFakeDatabase();
  installFakeDatabase();
  deleted.length = 0;
});

describe('lessonsAdmin against the fake database', () => {
  it('creates a lesson and stamps the publish date', async () => {
    const lesson = await createLesson({ series_id: 'series-1', title: ' جديد ', status: 'published' });
    expect(lesson.title).toBe('جديد');
    expect(db.lessons.find((l) => l.id === lesson.id)?.published_at).toBeTruthy();
  });

  it('refuses a lesson without a title or series', async () => {
    await expect(createLesson({ series_id: 'series-1', title: ' ' })).rejects.toThrow();
    await expect(createLesson({ title: 'x' })).rejects.toThrow();
  });

  it('updates a lesson and keeps the first publish date', async () => {
    const first = db.lessons.find((l) => l.id === 'lesson-1')!.published_at;
    await updateLesson('lesson-1', { title: 'معدّل', status: 'published' });
    const row = db.lessons.find((l) => l.id === 'lesson-1')!;
    expect(row.title).toBe('معدّل');
    expect(row.published_at).toBe(first);
  });

  it('gives a draft published for the first time a date', async () => {
    await updateLesson('lesson-2', { status: 'published' });
    expect(db.lessons.find((l) => l.id === 'lesson-2')!.published_at).toBeTruthy();
  });

  it('deletes a lesson, clears its extras and removes its recording', async () => {
    await updateLesson('lesson-1', { featured: true, image: 'https://x.test/a.jpg' });
    expect(extras().featured).toContain('lesson-1');
    await deleteLesson('lesson-1');
    expect(db.lessons.some((l) => l.id === 'lesson-1')).toBe(false);
    expect(extras().featured).not.toContain('lesson-1');
    expect(extras().images['lesson-1']).toBeUndefined();
    expect(deleted).toEqual(['/api/r2?file=audio%2Flesson-1.mp3']);
  });
});
