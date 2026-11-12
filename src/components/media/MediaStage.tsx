// The one player of the site, for a channel video page and a lesson page alike: "شاهد" (the video) and
// "استمع فقط" (sound only), with the download button. Whatever opens a video or a lesson shows this same player.
//   Listening: a sound file kept on the site (or the site's video file, as sound) plays in the site's own player
//   (keeps going with the screen off, shows in the notifications); a YouTube video starts at once on YouTube's
//   hidden player and moves to the site's player when its sound is ready (YoutubeAudioBar).
//   Watching: a video file kept on the site, else YouTube's player.
import React, { forwardRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Headphones, MonitorPlay } from 'lucide-react';
import { AudioPlayer, type MediaHandle } from '../AudioPlayer';
import { VideoPlayer } from '../VideoPlayer';
import { YoutubeAudioBar } from '../YoutubeAudioBar';
import { FilePlayer } from './FilePlayer';
import { useMediaMode } from './mediaMode';

export interface StageMedia {
  title: string;
  subtitle?: string;
  // Where progress and statistics are kept: a lesson's id, or "yt:<videoId>" for a channel video
  trackId: string;
  // The page the player's title leads back to (the bar at the foot of the screen, the notification)
  href: string;
  youtubeId?: string;
  videoFile?: string;
  audioFile?: string;
}

interface Props {
  media: StageMedia;
  startAt: number;
  // `from`: which kind of playback reported, so a page can count watching and listening apart
  onTimeUpdate: (seconds: number, duration: number, from: 'video' | 'audio') => void;
  onEnded: () => void;
  onDownload?: () => void;
}

export const MediaStage = forwardRef<MediaHandle, Props>(({ media, startAt, onTimeUpdate, onEnded, onDownload }, ref) => {
  const [params] = useSearchParams();
  const [mode, setMode] = useMediaMode(params.get('mode'));
  const { youtubeId, videoFile, audioFile, title, subtitle, trackId, href } = media;
  const canWatch = !!(videoFile || youtubeId);
  const canListen = !!(audioFile || videoFile || youtubeId);
  const listening = canListen && (mode === 'listen' || !canWatch);
  // A sound file first; else the site's video file played as sound
  const listenFile = audioFile ?? videoFile;
  const heard = (s: number, d: number) => onTimeUpdate(s, d, 'audio');
  const seen = (s: number, d: number) => onTimeUpdate(s, d, 'video');

  const tab = (active: boolean) =>
    `inline-flex items-center gap-2 h-11 px-4 rounded-lg text-sm font-bold transition-colors ${active ? 'bg-mushaf text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {canWatch && canListen && (
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
        {onDownload && (
          <button type="button" onClick={onDownload} className="press inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-gold hover:bg-gold-soft text-mushaf-deep text-sm font-bold">
            <Download className="w-4 h-4" aria-hidden="true" />
            تحميل
          </button>
        )}
      </div>

      {!canListen ? null : listening ? (
        listenFile ? (
          <AudioPlayer key={`file-${listenFile}`} ref={ref} track={{ id: trackId, title, subtitle, src: listenFile, href }} startAt={startAt} onTimeUpdate={heard} onEnded={onEnded} />
        ) : (
          <YoutubeAudioBar key={`yt-listen-${youtubeId}`} ref={ref} videoId={youtubeId!} title={title} subtitle={subtitle} trackId={trackId} href={href} startAt={startAt} onTimeUpdate={heard} onEnded={onEnded} />
        )
      ) : videoFile ? (
        <FilePlayer key={`watch-${videoFile}`} ref={ref} src={videoFile} title={title} startAt={startAt} onTimeUpdate={seen} onEnded={onEnded} />
      ) : (
        <VideoPlayer key={`yt-${youtubeId}`} ref={ref} youtubeUrl={`https://www.youtube.com/watch?v=${youtubeId}`} title={title} startAt={startAt} onTimeUpdate={seen} onEnded={onEnded} />
      )}
    </div>
  );
});
