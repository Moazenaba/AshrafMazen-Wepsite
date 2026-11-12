// What the shared player (MediaStage) and the download window need, made from a channel video or from a lesson,
// so both pages hand the same thing to the same player.
import type { SiteVideo } from '../../lib/libraryOverrides';
import { youtubeTrackId } from '../../lib/youtubeAudio';
import { getYouTubeId } from '../../lib/youtube';
import type { StageMedia } from './MediaStage';

export function stageOfVideo(video: SiteVideo, playlistTitle?: string): StageMedia {
  const uploaded = !!video.src;
  return {
    title: video.title,
    subtitle: playlistTitle,
    trackId: youtubeTrackId(video.id),
    href: `/video/${video.id}`,
    youtubeId: uploaded ? undefined : video.id,
    videoFile: video.files?.video ?? (uploaded && video.kind !== 'audio' ? video.src : undefined),
    audioFile: video.files?.audio ?? (uploaded && video.kind === 'audio' ? video.src : undefined),
  };
}

interface LessonLike {
  id: string;
  title: string;
  youtube_url?: string | null;
  audio_url?: string | null;
}

export function stageOfLesson(lesson: LessonLike, seriesTitle?: string): StageMedia {
  return {
    title: lesson.title,
    subtitle: seriesTitle,
    trackId: lesson.id,
    href: `/lesson/${lesson.id}`,
    youtubeId: getYouTubeId(lesson.youtube_url ?? '') ?? undefined,
    audioFile: lesson.audio_url || undefined,
  };
}

// The same lesson as the download window expects it: its YouTube video, and its recording as the sound file
export function downloadableOf(media: StageMedia): SiteVideo {
  const files = media.audioFile || media.videoFile ? { audio: media.audioFile, video: media.videoFile } : undefined;
  return { id: media.youtubeId ?? media.trackId, title: media.title, ...(files ? { files } : {}) };
}

export const hasMedia = (media: StageMedia) => !!(media.youtubeId || media.videoFile || media.audioFile);
