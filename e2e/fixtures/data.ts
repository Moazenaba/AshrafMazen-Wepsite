// Made-up site content for the browser tests (not real data). Shapes follow src/types.ts and /api/site.
const day = (back: number) => new Date(Date.UTC(2026, 10, 1) - back * 86400000).toISOString();

export const categories = [
  { id: 'c1', name: 'العقيدة', slug: 'aqeedah', description: '', sort_order: 1, color: 'emerald', icon: 'BookOpen' },
  { id: 'c2', name: 'الفقه', slug: 'fiqh', description: '', sort_order: 2, color: 'amber', icon: 'BookOpen' },
];

export const series = [
  { id: 's1', category_id: 'c1', title: 'شرح الأصول الثلاثة', slug: 'usul', description: '', sort_order: 1 },
  { id: 's2', category_id: 'c2', title: 'شرح عمدة الأحكام', slug: 'umdah', description: '', sort_order: 1 },
];

const base = { youtube_url: '', audio_url: '', transcript: '', status: 'published', views: 3 };
export const lessons = [
  { ...base, id: 'lesson-video', series_id: 's1', lesson_number: 1, title: 'الدرس الأول معنى التوحيد', youtube_url: 'https://www.youtube.com/watch?v=loVFoAlqeCc', published_at: day(1), created_at: day(1) },
  { ...base, id: 'lesson-audio', series_id: 's1', lesson_number: 2, title: 'الدرس الثاني أقسام التوحيد', audio_url: '/api/r2?file=audio%2Fsilence.wav', published_at: day(2), created_at: day(2) },
  { ...base, id: 'lesson-text', series_id: 's2', lesson_number: 1, title: 'الدرس الثالث كتاب الطهارة', transcript: 'نص مكتوب في أحكام الطهارة وآدابها.', published_at: day(3), created_at: day(3) },
  { ...base, id: 'lesson-picture', series_id: 's2', lesson_number: 2, title: 'الدرس الرابع باب المياه', transcript: 'نص قصير عن المياه.', published_at: day(4), created_at: day(4) },
  { ...base, id: 'lesson-featured', series_id: 's1', lesson_number: 3, title: 'الدرس الخامس شروط لا إله إلا الله', youtube_url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', published_at: day(5), created_at: day(5) },
];

export const draftLesson = { ...base, id: 'lesson-draft', series_id: 's1', lesson_number: 9, title: 'مسودة لا يراها الزوار', status: 'draft', published_at: null, created_at: day(0) };

export const books = [
  { id: 'book-1', title: 'كتاب التوحيد المختصر', author: 'الشيخ أشرف مازن', description: 'مختصر في التوحيد', category_id: 'c1', file_url: '/api/r2?file=library%2Ffiles%2Fa.pdf', cover_url: null, pages: 50, sort_order: 1, status: 'published', published_at: day(10), created_at: day(10) },
  { id: 'book-2', title: 'رسالة في الطهارة', author: 'الشيخ أشرف مازن', description: 'رسالة في الطهارة', category_id: 'c2', file_url: '/api/r2?file=library%2Ffiles%2Fb.pdf', cover_url: null, pages: 30, sort_order: 2, status: 'published', published_at: day(11), created_at: day(11) },
];

export const settings = [
  { key: 'banner_name', value: 'الاسم التجريبي للشيخ' },
  { key: 'about_sheikh', value: 'نبذة تجريبية' },
  { key: 'hero_quote', value: JSON.stringify({ text: 'العلم قبل القول والعمل', source: 'البخاري' }) },
  { key: 'lesson_extras', value: JSON.stringify({ featured: ['lesson-featured'], chapters: {}, images: { 'lesson-picture': '/api/r2?file=branding%2Fpic.png' } }) },
];

export const siteBundle = {
  updatedAt: day(0),
  settings,
  categories,
  series,
  lessons,
  social: [],
  transcripts: ['lesson-text', 'lesson-picture'],
};

export const library = {
  updatedAt: day(0),
  playlists: [
    { id: 'PLe2e000000000000001', title: 'قائمة تجريبية أولى', count: '3 فيديو', latestVideoId: 'vvvvvvvvvv1', videos: ['vvvvvvvvvv1', 'vvvvvvvvvv2', 'vvvvvvvvvv3'].map((id, i) => ({ id, title: `فيديو ${i + 1}`, published: day(i) })) },
    { id: 'PLe2e000000000000002', title: 'قائمة تجريبية ثانية', count: '3 فيديو', latestVideoId: 'vvvvvvvvvv4', videos: ['vvvvvvvvvv4', 'vvvvvvvvvv5', 'vvvvvvvvvv6'].map((id, i) => ({ id, title: `فيديو ${i + 4}`, published: day(i) })) },
  ],
};

export const liveOff = { live: false };
export const liveOn = { live: true, videoId: 'liveVideo01', title: 'بث تجريبي' };
