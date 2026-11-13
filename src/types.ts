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
  chapters?: LessonChapter[];
};

// A point in the lesson the visitor can jump to; seconds from the start of the media
export type LessonChapter = {
  seconds: number;
  title: string;
};

// A book or written work in the library, kept as a PDF file
export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  category_id: string | null;
  file_url: string;
  cover_url: string | null;
  pages: number | null;
  sort_order: number;
  status: LessonStatus;
  published_at: string | null;
  created_at: string;
};

export type AdminUser = {
  email: string;
  name: string;
  role: string;
};

export type SocialPlatform =
  | 'facebook'
  | 'youtube'
  | 'x'
  | 'instagram'
  | 'telegram'
  | 'whatsapp'
  | 'tiktok'
  | 'soundcloud'
  | 'blogger'
  | 'snapchat'
  | 'website'
  | 'email'
  | 'podcast'
  | string;

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface SiteSettings {
  banner_name: string;
  banner_logo_url: string | null;
  about_sheikh?: string;
  // The id of the font of the sheikh's name (constants/nameFonts)
  banner_font?: string;
}

