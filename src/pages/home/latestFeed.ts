// The "latest" feed of the home page: the site's lessons and the newest videos of each playlist, and its filter options.
import type { LatestCategory, LatestItem } from '../../components/LatestSearch';
import type { LibraryPlaylist } from '../../data/youtube-library';
import type { CategoryWithPortalData, LessonWithRelations } from '../../services/dataService';
import { formatArabicDate } from '../../utils/helpers';
import { isSermonCategory, JUMUAH_PLAYLIST_ID } from './sermons';

// Everything that was just published. A lesson in the sermon category counts as the sermons playlist,
// so it is listed under one name.
export function buildLatestItems(latestList: LessonWithRelations[], library: LibraryPlaylist[]): LatestItem[] {
  const lessonItems: LatestItem[] = latestList.map((lesson) => {
    const name = lesson.category?.name ?? '';
    return {
      id: lesson.id,
      title: lesson.title,
      href: `/lesson/${lesson.id}`,
      meta: [lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · '),
      category: isSermonCategory(name) ? `pl:${JUMUAH_PLAYLIST_ID}` : name ? `db:${name}` : '',
      date: lesson.published_at ?? '',
      youtubeUrl: lesson.youtube_url,
      audioUrl: lesson.audio_url,
      transcript: lesson.transcript,
    };
  });
  const videoItems: LatestItem[] = library.flatMap((playlist) =>
    playlist.videos.slice(0, 3).map((video) => ({
      id: `yt:${video.id}`,
      title: video.title,
      href: `/video/${video.id}?list=${playlist.id}`,
      meta: [playlist.title, video.published ? formatArabicDate(video.published) : ''].filter(Boolean).join(' · '),
      category: `pl:${playlist.id}`,
      date: video.published ?? '',
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    }))
  );
  // Newest first; items without a date keep their order at the end
  return [...lessonItems, ...videoItems].sort((a, b) => b.date.localeCompare(a.date));
}

export function buildCategoryOptions(activeCategories: CategoryWithPortalData[], library: LibraryPlaylist[]): LatestCategory[] {
  return [
      ...activeCategories
        .filter((cat) => !isSermonCategory(cat.name))
        .map((cat) => ({ value: `db:${cat.name}`, label: cat.name })),
      ...library.map((playlist) => ({ value: `pl:${playlist.id}`, label: playlist.title })),
    ];
}
