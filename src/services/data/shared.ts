// Shared types and helpers used by every data module.
import type { Category, Series, Lesson, Book, AdminUser, SocialLink, SocialPlatform, SiteSettings } from '../../types';

export type {
  Category,
  Series,
  Lesson,
  Book,
  AdminUser,
  SocialLink,
  SocialPlatform,
  SiteSettings,
};

export interface LessonWithRelations extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

// Sluggify string with Arabic support and English fallback
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '-')
    .replace(/[^\w\u0621-\u064A0-9\-]/g, '');
}
