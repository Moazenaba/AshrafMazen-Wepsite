// The channel's videos in the site's categories and search ("كل الدروس"). A playlist belongs to the category the
// admin chose for it ("فيديوهات القناة" → القسم), else to the one its title points to (شرح العقيدة الواسطية →
// العقيدة). No database or screen here.
import { normalizeArabic, searchScore } from '../utils/arabicSearch';

export interface CategoryRef {
  name: string;
  slug: string;
}

// The admin's choice that a playlist belongs to no category
export const NO_CATEGORY = 'none';

// Words in a playlist's title that point to a category, by words in the category's name
const HINTS: { category: string[]; title: string[] }[] = [
  { category: ['خطب', 'خطبة'], title: ['خطب', 'خطبه', 'جمعه'] },
  { category: ['اصول فقه'], title: ['اصول', 'الاصول', 'قواعد فقهيه', 'الورقات'] },
  { category: ['مصطلح حديث', 'مصطلح'], title: ['مصطلح', 'نخبه', 'البيقونيه', 'علوم الحديث', 'الاربعين'] },
  { category: ['عقيده', 'توحيد'], title: ['عقيده', 'العقيده', 'توحيد', 'التوحيد', 'معتقد', 'المعتقد', 'الواسطيه', 'الدجال', 'ايمان', 'الشرك'] },
  { category: ['فقه'], title: ['فقه', 'الفقه', 'صلاه', 'صيام', 'زكاه', 'الحج', 'طهاره', 'الصوم', 'العمده', 'الزاد'] },
];

// A category's name without "ال" at the start of its words, to compare names ("الفقه" = "فقه", not "أصول الفقه")
const bare = (name: string) => normalizeArabic(name).split(/\s+/).map((w) => w.replace(/^ال/, '')).join(' ');

// The category a playlist's title points to, if one of the site's categories matches
export function guessCategory(title: string, categories: CategoryRef[]): string | undefined {
  const t = normalizeArabic(title);
  for (const hint of HINTS) {
    if (!hint.title.some((w) => t.includes(normalizeArabic(w)))) continue;
    const words = hint.category.map(bare);
    // A category named exactly so first, else one whose name holds the word
    const match = categories.find((c) => words.includes(bare(c.name))) ?? categories.find((c) => words.some((w) => bare(c.name).includes(w)));
    if (match) return match.slug;
  }
  return undefined;
}

export function categoryOfPlaylist(playlist: { title: string; category?: string }, categories: CategoryRef[]): string | undefined {
  if (playlist.category === NO_CATEGORY) return undefined;
  return playlist.category || guessCategory(playlist.title, categories);
}

export interface ChannelHit {
  id: string;
  title: string;
  playlistId: string;
  playlist: string;
  published: string;
  score: number;
}

interface Playlist {
  id: string;
  title: string;
  category?: string;
  videos: { id: string; title: string; published?: string; src?: string }[];
}

// The channel's videos for a search: each once (a video can sit in several playlists), only the given category's
// when one is chosen; with words, the best matches first, else the newest first
export function channelVideos(library: Playlist[], options: { query: string; categorySlug: string; categories: CategoryRef[] }): ChannelHit[] {
  const needle = options.query.trim();
  const found = new Map<string, ChannelHit>();
  for (const playlist of library) {
    if (options.categorySlug && categoryOfPlaylist(playlist, options.categories) !== options.categorySlug) continue;
    for (const video of playlist.videos) {
      if (found.has(video.id) || video.src) continue;
      const score = needle ? searchScore(`${video.title} ${playlist.title}`, needle) : 1;
      if (score > 0) found.set(video.id, { id: video.id, title: video.title, playlistId: playlist.id, playlist: playlist.title, published: video.published ?? '', score });
    }
  }
  const hits = [...found.values()];
  return needle ? hits.sort((a, b) => b.score - a.score) : hits.sort((a, b) => b.published.localeCompare(a.published));
}

export interface PlaylistHit {
  id: string;
  title: string;
  count: string;
}

// The playlists for a search: those whose name matches the words (best first), or, with a category chosen and no
// words, that category's playlists. A playlist shows by its name even if none of its videos' titles match.
export function channelPlaylists(
  library: { id: string; title: string; count?: string; category?: string }[],
  options: { query: string; categorySlug: string; categories: CategoryRef[] }
): PlaylistHit[] {
  const needle = options.query.trim();
  const hits: (PlaylistHit & { score: number })[] = [];
  for (const playlist of library) {
    if (options.categorySlug && categoryOfPlaylist(playlist, options.categories) !== options.categorySlug) continue;
    const score = needle ? searchScore(playlist.title, needle) : 1;
    if (score > 0) hits.push({ id: playlist.id, title: playlist.title, count: playlist.count ?? '', score });
  }
  return needle ? hits.sort((a, b) => b.score - a.score) : hits;
}
