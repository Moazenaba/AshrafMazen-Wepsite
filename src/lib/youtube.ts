// YouTube helpers: the video ID from any link, thumbnails, and the IFrame API loaded once on demand.

const ID_IN_URL = /(?:youtu\.be\/|[?&]v=|youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/;
const BARE_ID = /^[a-zA-Z0-9_-]{11}$/;

export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.trim();
  if (BARE_ID.test(clean)) return clean;
  const match = clean.match(ID_IN_URL);
  return match ? match[1] : null;
}

// hqdefault exists for every video; maxresdefault does not, so it is not used
export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

// The parts of the IFrame API this site uses
export interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
  // Used by the sound-only bar (components/YoutubeAudioBar.tsx), which drives a hidden player
  playVideo?(): void;
  pauseVideo?(): void;
  setPlaybackRate?(rate: number): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: (event: { data: number }) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YTNamespace>((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error('تعذّر تحميل مشغّل يوتيوب'));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}
