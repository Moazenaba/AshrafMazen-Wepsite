// Pure rules: the channel library as visitors see it once the admin's choices are applied.
// Hidden playlists and videos stay hidden for good (a video the admin removed is never brought back by YouTube's
// updates, while new ones still arrive); the admin may also add videos to any playlist, upload files to the site,
// attach a recording or a video file to any video (for listening and downloading), and order the playlists.
import type { LibraryPlaylist, LibraryVideo } from '../data/youtube-library';
import type { YoutubeOverrides } from '../services/data/youtube';

export type MediaFiles = { audio?: string; video?: string };

export interface SiteVideo extends LibraryVideo {
  // A file uploaded to the site: played by the site's own player instead of YouTube
  src?: string;
  kind?: 'video' | 'audio';
  // Files visitors can listen to or download
  files?: MediaFiles;
}

export interface SitePlaylist extends Omit<LibraryPlaylist, 'videos'> {
  videos: SiteVideo[];
  // The admin's category for it (a slug, or "none"); see lib/channelSearch
  category?: string;
}

export const EXTRA_VIDEOS_LIST = 'extra-videos';

export const isUploadedId = (id: string) => id.startsWith('up-');

// The files of one video: its own upload, plus what the admin attached to it
export function filesOf(video: SiteVideo, attached: Record<string, MediaFiles> | undefined): MediaFiles | undefined {
  const own: MediaFiles = video.src ? { [video.kind ?? 'video']: video.src } : {};
  const files = { ...own, ...(attached?.[video.id] ?? {}) };
  return files.audio || files.video ? files : undefined;
}

const usable = (v: SiteVideo | undefined) => !!v?.id && !!v?.title;

// The single videos the admin added, as one list shown first
function extraVideosPlaylist(o: YoutubeOverrides): SitePlaylist[] {
  const videos = (o.extraVideos ?? []).filter(usable).map((v) => ({ ...v, published: v.published ?? '' }));
  if (videos.length === 0) return [];
  return [{ id: EXTRA_VIDEOS_LIST, title: 'مقاطع مختارة', count: `${videos.length} فيديو`, latestVideoId: videos[0].id, videos }];
}

// Items (playlists, or the videos of one) in the admin's order; any the admin has not placed keep their place after them
export function orderPlaylists<T extends { id: string }>(list: T[], order: string[] | undefined): T[] {
  if (!order?.length) return list;
  const rank = new Map(order.map((id, i) => [id, i]));
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (rank.get(a.p.id) ?? order.length + a.i) - (rank.get(b.p.id) ?? order.length + b.i))
    .map(({ p }) => p);
}

export function applyOverrides(library: SitePlaylist[], o: YoutubeOverrides | null): SitePlaylist[] {
  if (!o) return library;
  if (library.length > 0) library = [...extraVideosPlaylist(o), ...library];
  const hiddenPlaylists = new Set(o.hiddenPlaylists);
  const hiddenVideos = new Set(o.hiddenVideos);
  const shown = library
    .filter((p) => !hiddenPlaylists.has(p.id))
    .map((p) => {
      const added = (o.playlistAdditions?.[p.id] ?? []).filter(usable);
      const addedIds = new Set(added.map((v) => v.id));
      const removed = new Set(o.playlistRemovals?.[p.id] ?? []);
      const videos = orderPlaylists([...added, ...p.videos.filter((v) => !addedIds.has(v.id))], o.videoOrder?.[p.id])
        .filter((v) => !hiddenVideos.has(v.id) && !removed.has(v.id))
        .map((v) => {
          const title = o.videoTitles[v.id] || v.title;
          const files = filesOf(v, o.mediaFiles);
          return title === v.title && !files ? v : { ...v, title, ...(files ? { files } : {}) };
        });
      return {
        ...p,
        title: o.playlistTitles[p.id] || p.title,
        ...(o.playlistCategories?.[p.id] ? { category: o.playlistCategories[p.id] } : {}),
        videos,
        count: `${videos.length} فيديو`,
        // The playlist's picture must be a YouTube video that is still shown
        latestVideoId: videos.some((v) => v.id === p.latestVideoId) ? p.latestVideoId : videos.find((v) => !v.src)?.id || p.latestVideoId,
      };
    })
    .filter((p) => p.videos.length > 0);
  return orderPlaylists(shown, o.playlistOrder);
}
