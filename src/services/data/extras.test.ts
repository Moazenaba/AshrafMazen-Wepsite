import { describe, expect, it, vi } from 'vitest';

// extras.ts imports the Supabase client; these tests use only its pure functions
vi.mock('../../lib/supabase', () => ({ supabase: {} }));
vi.mock('./jsonRecord', () => ({ updateSiteRecord: vi.fn() }));

const { lessonRow, parseLessonExtras, withExtras, withImages } = await import('./extras');

const lesson = (id: string) => ({ id, title: 'درس', series_id: 's', lesson_number: 1, status: 'published' }) as any;

describe('lesson extras: the lesson picture', () => {
  it('reads the saved pictures and leaves out empty or broken ones', () => {
    const extras = parseLessonExtras(JSON.stringify({ featured: ['a'], chapters: {}, images: { a: '/api/r2?file=branding%2Fhero%2Fx.jpeg', b: '', c: 5 } }));
    expect(extras.images).toEqual({ a: '/api/r2?file=branding%2Fhero%2Fx.jpeg' });
    expect(parseLessonExtras(null).images).toEqual({});
    expect(parseLessonExtras('{"featured":[]}').images).toEqual({});
  });

  it('gives each lesson its picture, and none to the others', () => {
    const extras = parseLessonExtras(JSON.stringify({ images: { a: 'https://x/a.jpg' } }));
    expect(withImages([lesson('a'), lesson('b')], extras).map((l) => l.image)).toEqual(['https://x/a.jpg', undefined]);
    expect(withExtras(lesson('a'), extras).image).toBe('https://x/a.jpg');
    expect(withExtras(lesson('b'), extras).image).toBeUndefined();
  });

  it('never writes the picture into the lessons table', () => {
    const row = lessonRow({ title: 'درس', featured: true, chapters: [], image: 'https://x/a.jpg' } as any);
    expect(row).toEqual({ title: 'درس' });
  });
});
