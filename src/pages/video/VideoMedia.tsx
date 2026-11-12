// The player of a channel video, in two modes: "شاهد" (the video) and "استمع فقط" (sound only).
// Listening uses the recording the admin attached when there is one; a file uploaded to the site plays in the site's
// own player; otherwise YouTube's player is hidden and driven by the site's own sound bar.
import React, { useRef, useState } from 'react';
import { Download, Headphones, MonitorPlay } from 'lucide-react';
import { VideoPlayer } from '../../components/VideoPlayer';
import { YoutubeAudioBar } from '../../components/YoutubeAudioBar';
import type { SiteVideo } from '../../lib/libraryOverrides';
import { getYouTubeThumbnail } from '../../lib/youtube';

export type MediaMode = 'watch' | 'listen';
const MODE_KEY = 'media_mode';

export function useMediaMode(): [MediaMode, (m: MediaMode) => void] {
  const [mode, setMode] = useState<MediaMode>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === 'listen' ? 'listen' : 'watch';
    } catch {
      return 'watch';
    }
  });
  const set = (m: MediaMode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // private window: the choice lasts this page only
    }
  };
  return [mode, set];
}

interface Props {
  video: SiteVideo;
  startAt: number;
  onTimeUpdate: (seconds: number, duration: number) => void;
  onEnded: () => void;
  onDownload: () => void;
}

// <video> or <audio> for a file kept on the site, reporting its position like the YouTube player
const FilePlayer: React.FC<{ src: string; audio: boolean; title: string; startAt: number; onTimeUpdate: Props['onTimeUpdate']; onEnded: () => void }> = ({ src, audio, title, startAt, onTimeUpdate, onEnded }) => {
  const ref = useRef<HTMLMediaElement | null>(null);
  const last = useRef(0);
  const common = {
    src,
    controls: true,
    preload: 'metadata' as const,
    'aria-label': title,
    onLoadedMetadata: () => {
      if (ref.current && startAt > 0 && startAt < (ref.current.duration || Infinity) - 5) ref.current.currentTime = startAt;
    },
    onTimeUpdate: () => {
      const el = ref.current;
      if (!el || Math.abs(el.currentTime - last.current) < 3) return;
      last.current = el.currentTime;
      onTimeUpdate(el.currentTime, el.duration || 0);
    },
    onEnded,
  };
  return audio ? (
    <audio ref={(el) => void (ref.current = el)} {...common} className="w-full" />
  ) : (
    <video ref={(el) => void (ref.current = el)} {...common} playsInline className="w-full aspect-video rounded-xl bg-black" />
  );
};

export const VideoMedia: React.FC<Props> = ({ video, startAt, onTimeUpdate, onEnded, onDownload }) => {
  const [mode, setMode] = useMediaMode();
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const audioFile = video.files?.audio ?? (video.src && video.kind === 'audio' ? video.src : undefined);
  const videoFile = video.files?.video ?? (video.src && video.kind !== 'audio' ? video.src : undefined);
  const onlyAudio = !!video.src && video.kind === 'audio';
  const listening = mode === 'listen' || onlyAudio;
  // A video file can be listened to as sound when there is no separate recording
  const listenSrc = audioFile ?? videoFile;

  const tab = (active: boolean) =>
    `inline-flex items-center gap-2 h-11 px-4 rounded-lg text-sm font-bold transition-colors ${active ? 'bg-mushaf text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!onlyAudio && (
          <div role="group" aria-label="طريقة العرض" className="inline-flex gap-1 p-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <button type="button" aria-pressed={!listening} onClick={() => setMode('watch')} className={tab(!listening)}>
              <MonitorPlay className="w-4 h-4" aria-hidden="true" />
              شاهد
            </button>
            <button type="button" aria-pressed={listening} onClick={() => setMode('listen')} className={tab(listening)}>
              <Headphones className="w-4 h-4" aria-hidden="true" />
              استمع فقط
            </button>
          </div>
        )}
        <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-gold hover:bg-gold-soft text-mushaf-deep text-sm font-bold">
          <Download className="w-4 h-4" aria-hidden="true" />
          تحميل
        </button>
      </div>

      {listening ? (
        listenSrc ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-mushaf text-white">
            {!video.src && <img src={getYouTubeThumbnail(youtubeUrl) ?? undefined} alt="" className="hidden sm:block w-32 aspect-video object-cover rounded-lg" />}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="flex items-center gap-2 text-sm text-gold-soft">
                <Headphones className="w-4 h-4" aria-hidden="true" />
                استماع فقط
              </p>
              <FilePlayer key={`listen-${listenSrc}`} src={listenSrc} audio title={video.title} startAt={startAt} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
            </div>
          </div>
        ) : (
          <YoutubeAudioBar key={`yt-listen-${video.id}`} videoId={video.id} title={video.title} startAt={startAt} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
        )
      ) : videoFile && video.src ? (
        <FilePlayer key={`watch-${videoFile}`} src={videoFile} audio={false} title={video.title} startAt={startAt} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
      ) : (
        <VideoPlayer key={`yt-${video.id}`} youtubeUrl={youtubeUrl} title={video.title} startAt={startAt} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
      )}
    </div>
  );
};
