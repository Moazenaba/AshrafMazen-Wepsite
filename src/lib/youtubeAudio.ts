// Listening to a channel video as sound only, in the site's own player (so it keeps playing with the screen off
// and shows in the phone's notifications). The sound comes through /api/media-link like a download.
import type { SiteVideo } from './libraryOverrides';

// The id a channel video's sound is kept under (progress, statistics), the same key its video page counts views under
export const youtubeTrackId = (videoId: string) => `yt:${videoId}`;
export const isYoutubeTrackId = (id: string) => id.startsWith('yt:');

// The original sound (WebM/Opus) arrives fast and whole; a browser that cannot play it (older iPhones) gets an MP3,
// which the service converts while sending, so it starts slower and its length shows only at the end
export function listenKind(canPlay: (type: string) => string = (t) => document.createElement('audio').canPlayType(t)): 'listen' | 'audio' {
  return canPlay('audio/webm; codecs="opus"') ? 'listen' : 'audio';
}

export async function youtubeAudioUrl(videoId: string): Promise<string> {
  const response = await fetch(`/api/media-link?id=${encodeURIComponent(videoId)}&kind=${listenKind()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.url !== 'string') throw new Error(data?.error || 'تعذّر تشغيل الصوت الآن. حاول بعد قليل.');
  return data.url;
}

// A file of the video's own on the site (uploaded, or attached by the admin) is played as is; else YouTube's sound
export function siteAudioOf(video: SiteVideo): string | undefined {
  return video.files?.audio || (video.kind === 'audio' ? video.src : undefined);
}

// A tiny silent sound played from the visitor's tap while the real link is fetched: phones only let a page start
// sound from a tap, and the link arrives seconds later
export const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
