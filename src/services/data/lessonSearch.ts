// Searching published lessons by title, series or category, in Arabic that ignores marks and letter forms.
import type { Lesson } from '../../types';
import { searchScore } from '../../utils/arabicSearch';
import { publishedLessons, rowsOrThrow } from './db';
import { attachRelations } from './relations';
import type { LessonWithRelations } from './shared';

// With allowEmpty, an empty query returns every published lesson (the search page then filters by category).
// The matching runs here rather than in the database, which cannot ignore the Arabic marks.
export async function searchLessons(query: string, allowEmpty = false): Promise<LessonWithRelations[]> {
  const text = (query || '').trim();
  if (!text && !allowEmpty) return [];
  const lessons = rowsOrThrow<Lesson>(await publishedLessons().order('published_at', { ascending: false }));
  const related = await attachRelations(lessons);
  if (!text) return related;
  // Best matches first; equal matches keep the newest-first order
  return related
    .map((l) => ({ l, score: searchScore(`${l.title} ${l.series?.title || ''} ${l.category?.name || ''}`, text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.l);
}
