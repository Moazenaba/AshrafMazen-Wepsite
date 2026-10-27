export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  color: string;
  icon: string;
};

export type Series = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  sort_order: number;
};

export type LessonStatus = 'draft' | 'published';

export type Lesson = {
  id: string;
  series_id: string;
  lesson_number: number;
  title: string;
  youtube_url: string;
  audio_url: string;
  transcript: string;
  status: LessonStatus;
  published_at: string | null;
  created_at: string;
  views?: number;
  featured?: boolean;
};

export type AdminUser = {
  email: string;
  name: string;
  role: string;
};
