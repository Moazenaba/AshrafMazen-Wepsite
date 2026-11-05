// The channel's videos: what the admin hid, renamed or added.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';

export interface YoutubeOverrides {
  hiddenPlaylists: string[];
  hiddenVideos: string[];
  videoTitles: Record<string, string>;
  playlistTitles: Record<string, string>;
  // Playlists added by the admin; api/youtube-library.ts reads their videos from YouTube's feed
  extraPlaylists: { id: string; title: string }[];
}

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
    };
  } catch {
    return { hiddenPlaylists: [], hiddenVideos: [], videoTitles: {}, playlistTitles: {}, extraPlaylists: [] };
  }
}

export async function saveYoutubeOverrides(overrides: YoutubeOverrides): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert([{ key: YOUTUBE_OVERRIDES_KEY, value: JSON.stringify(overrides) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
}
