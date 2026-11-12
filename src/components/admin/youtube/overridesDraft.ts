// Pure edits of the admin's draft of the channel settings, so the screens only call them.
import type { YoutubeOverrides } from '../../../services/data/youtube';
import type { MediaFiles, SiteVideo } from '../../../lib/libraryOverrides';

export const newUploadId = () => `up-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

// A file's name without its extension, as a first title
export const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

export function addToPlaylist(d: YoutubeOverrides, playlistId: string, video: SiteVideo): YoutubeOverrides {
  const list = d.playlistAdditions[playlistId] ?? [];
  if (list.some((v) => v.id === video.id)) return d;
  return {
    ...d,
    playlistAdditions: { ...d.playlistAdditions, [playlistId]: [video, ...list] },
    // Adding a video back undoes its removal (from the site, or from this playlist)
    hiddenVideos: d.hiddenVideos.filter((id) => id !== video.id),
    playlistRemovals: withoutId(d.playlistRemovals, playlistId, video.id),
  };
}

// A map of lists (per playlist) without one id in one list; an emptied list is dropped
function withoutId(map: Record<string, string[]>, playlistId: string, id: string): Record<string, string[]> {
  const list = (map[playlistId] ?? []).filter((x) => x !== id);
  const next = { ...map, [playlistId]: list };
  if (list.length === 0) delete next[playlistId];
  return next;
}

// Takes a video out of this playlist only: one the admin added is dropped, one from YouTube is kept out
// (it stays on the site and in its other playlists)
export function takeOutOfPlaylist(d: YoutubeOverrides, playlistId: string, videoId: string): YoutubeOverrides {
  if ((d.playlistAdditions[playlistId] ?? []).some((v) => v.id === videoId)) return removeFromPlaylist(d, playlistId, videoId);
  const list = d.playlistRemovals[playlistId] ?? [];
  if (list.includes(videoId)) return d;
  return { ...d, playlistRemovals: { ...d.playlistRemovals, [playlistId]: [...list, videoId] } };
}

export function putBackInPlaylist(d: YoutubeOverrides, playlistId: string, videoId: string): YoutubeOverrides {
  return { ...d, playlistRemovals: withoutId(d.playlistRemovals, playlistId, videoId) };
}

// Moves a video from one playlist to another (it shows at the top of the other one)
export function moveToPlaylist(d: YoutubeOverrides, fromId: string, toId: string, video: SiteVideo): YoutubeOverrides {
  if (fromId === toId) return d;
  return takeOutOfPlaylist(addToPlaylist(d, toId, video), fromId, video.id);
}

// One video a step up or down inside its playlist; `orderedIds` is the playlist as the admin sees it now
export function moveVideo(d: YoutubeOverrides, playlistId: string, orderedIds: string[], index: number, step: -1 | 1): YoutubeOverrides {
  const target = index + step;
  if (target < 0 || target >= orderedIds.length) return d;
  const ids = orderedIds.slice();
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return { ...d, videoOrder: { ...d.videoOrder, [playlistId]: ids } };
}

export function removeFromPlaylist(d: YoutubeOverrides, playlistId: string, videoId: string): YoutubeOverrides {
  const list = (d.playlistAdditions[playlistId] ?? []).filter((v) => v.id !== videoId);
  const next = { ...d.playlistAdditions, [playlistId]: list };
  if (list.length === 0) delete next[playlistId];
  return { ...d, playlistAdditions: next };
}

export function setMediaFile(d: YoutubeOverrides, videoId: string, kind: keyof MediaFiles, url: string | null): YoutubeOverrides {
  const files = { ...(d.mediaFiles[videoId] ?? {}) };
  if (url) files[kind] = url;
  else delete files[kind];
  const next = { ...d.mediaFiles, [videoId]: files };
  if (!files.audio && !files.video) delete next[videoId];
  return { ...d, mediaFiles: next };
}

export function movePlaylist(d: YoutubeOverrides, orderedIds: string[], index: number, step: -1 | 1): YoutubeOverrides {
  const target = index + step;
  if (target < 0 || target >= orderedIds.length) return d;
  const ids = orderedIds.slice();
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return { ...d, playlistOrder: ids };
}
