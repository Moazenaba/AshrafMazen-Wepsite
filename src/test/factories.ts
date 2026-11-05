// Small builders for test data, so each test shows only the values it cares about.
import type { Category, Lesson, Series } from '../types';
import type { LessonWithRelations } from '../services/data/shared';

export const lesson = (over: Partial<Lesson> = {}): Lesson => ({
  id: 'l1',
  series_id: 's1',
  lesson_number: 1,
  title: 'درس',
  youtube_url: '',
  audio_url: '',
  transcript: '',
  status: 'published',
  published_at: null,
  created_at: '2026-01-01T00:00:00Z',
  ...over,
});

export const related = (over: Partial<LessonWithRelations> = {}): LessonWithRelations => ({ ...lesson(), series: null, category: null, ...over });

export const series = (over: Partial<Series> = {}): Series => ({
  id: 's1',
  category_id: 'c1',
  title: 'سلسلة',
  slug: 'series',
  description: '',
  sort_order: 1,
  ...over,
});

export const category = (over: Partial<Category> = {}): Category => ({
  id: 'c1',
  name: 'العقيدة',
  slug: 'aqeedah',
  sort_order: 1,
  color: 'emerald',
  icon: 'BookOpen',
  ...over,
});
