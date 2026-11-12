// The channel's videos: what the admin hid, renamed or added.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { MediaFiles, SiteVideo } from '../../lib/libraryOverrides';

export interface YoutubeOverrides {
  hiddenPlaylists: string[];
  hiddenVideos: string[];
  videoTitles: Record<string, string>;
  playlistTitles: Record<string, string>;
  // Playlists added by the admin; api/youtube-library.ts reads their videos from YouTube's feed
  extraPlaylists: { id: string; title: string }[];
  // Single videos added by the admin (newest first); the site shows them as one list, «مقاطع مختارة»
  // (a video uploaded to the site carries its file in src)
  extraVideos: SiteVideo[];
  // Videos the admin added to a playlist (YouTube links or uploaded files), shown at its top
  playlistAdditions: Record<string, SiteVideo[]>;
  // The order of the playlists in the menu and the pages
  playlistOrder: string[];
  // A recording and/or a video file attached to a video, for "listen only" and downloading
  mediaFiles: Record<string, MediaFiles>;
  // Videos taken out of one playlist only (hiddenVideos takes a video off the whole site)
  playlistRemovals: Record<string, string[]>;
  // The admin's order of the videos inside a playlist (videos not placed keep their place after them)
  videoOrder: Record<string, string[]>;
  // The site category (its slug) a playlist belongs to in "كل الدروس"; "none" = none. Unset: guessed from its title
  playlistCategories: Record<string, string>;
}

export const EMPTY_OVERRIDES: YoutubeOverrides = {
  hiddenPlaylists: [], hiddenVideos: [], videoTitles: {}, playlistTitles: {}, extraPlaylists: [], extraVideos: [],
  playlistAdditions: {}, playlistOrder: [], mediaFiles: {}, playlistRemovals: {}, videoOrder: {}, playlistCategories: {},
};

const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

const YOUTUBE_OVERRIDES_KEY = 'youtube_overrides';

export async function getYoutubeOverrides(): Promise<YoutubeOverrides> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', YOUTUBE_OVERRIDES_KEY).maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  try {
    const parsed = JSON.parse(data?.value || '{}');
    return {
      hiddenPlaylists: Array.isArray(parsed.hiddenPlaylists) ? parsed.hiddenPlaylists : [],
      hiddenVideos: Array.isArray(parsed.hiddenVideos) ? parsed.hiddenVideos : [],
      videoTitles: parsed.videoTitles && typeof parsed.videoTitles === 'object' ? parsed.videoTitles : {},
      playlistTitles: parsed.playlistTitles && typeof parsed.playlistTitles === 'object' ? parsed.playlistTitles : {},
      extraPlaylists: Array.isArray(parsed.extraPlaylists) ? parsed.extraPlaylists : [],
      extraVideos: Array.isArray(parsed.extraVideos) ? parsed.extraVideos : [],
      playlistAdditions: isObject(parsed.playlistAdditions) ? parsed.playlistAdditions : {},
      playlistOrder: Array.isArray(parsed.playlistOrder) ? parsed.playlistOrder : [],
      mediaFiles: isObject(parsed.mediaFiles) ? parsed.mediaFiles : {},
      playlistRemovals: isObject(parsed.playlistRemovals) ? parsed.playlistRemovals : {},
      videoOrder: isObject(parsed.videoOrder) ? parsed.videoOrder : {},
      playlistCategories: isObject(parsed.playlistCategories) ? parsed.playlistCategories : {},
    };
  } catch {
    return EMPTY_OVERRIDES;
  }
}

export async function saveYoutubeOverrides(overrides: YoutubeOverrides): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert([{ key: YOUTUBE_OVERRIDES_KEY, value: JSON.stringify(overrides) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
}
