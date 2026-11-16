// What YouTube says about a video (its title and channel), from the public oEmbed address; null when it cannot be had.
import { getYouTubeId } from '../../lib/youtube';
import { timedFetch } from '../../lib/timedFetch';
import type { VideoInfo } from './homeFeatureRules';

export async function fetchVideoInfo(videoUrl: string): Promise<VideoInfo | null> {
  const id = getYouTubeId(videoUrl);
  if (!id) return null;
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    const response = await timedFetch(url, {}, 8000);
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.title === 'string' && data.title.trim() ? { title: data.title.trim(), author: String(data.author_name ?? '').trim() } : null;
  } catch {
    return null;
  }
}
