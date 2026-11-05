import type { Category, Lesson, Series } from '../../../types';

export interface LessonAdminItem extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

export type AdminTab =
  | 'stats' | 'requests' | 'videos' | 'lessons' | 'series' | 'categories' | 'books' | 'quotes' | 'branding' | 'system';
