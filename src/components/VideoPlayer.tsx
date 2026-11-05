import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { getYouTubeId, getYouTubeThumbnail, loadYouTubeApi, type YTPlayer } from '../lib/youtube';
import { formatAudioTime } from '../utils/helpers';
import type { MediaHandle } from './AudioPlayer';
import { useAudio } from '../context/AudioContext';

// How often playback position is reported while the video plays
const POSITION_INTERVAL_MS = 3000;

interface VideoPlayerProps {
  youtubeUrl: string;
  title: string;
  startAt?: number;
  onTimeUpdate?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

// YouTube video with a light facade: a poster and a play button until the visitor asks for the player.
// The player itself comes from youtube-nocookie.com and reports its position back to the page.
export const VideoPlayer = forwardRef<MediaHandle, VideoPlayerProps>(
  ({ youtubeUrl, title, startAt = 0, onTimeUpdate, onEnded }, ref) => {
    const videoId = getYouTubeId(youtubeUrl);
    const thumb = getYouTubeThumbnail(youtubeUrl);
    const [started, setStarted] = useState(false);
    // YouTube serves a small grey picture when it has no real thumbnail yet; the poster then stays plain
    const [posterMissing, setPosterMissing] = useState(false);
    // A recording playing in the bar stops when the visitor starts a video, so the two never play together
    const { pause: pauseAudio } = useAudio();
    const frameRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const startFromRef = useRef(startAt);
    const callbacksRef = useRef({ onTimeUpdate, onEnded });

    useEffect(() => {
      callbacksRef.current = { onTimeUpdate, onEnded };
    });

    useImperativeHandle(ref, () => ({
      seek(seconds: number) {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, true);
        } else {
          startFromRef.current = seconds;
          setStarted(true);
        }
      },
    }));

    useEffect(() => {
      if (!started || !videoId || !frameRef.current) return;

      const mount = document.createElement('div');
      mount.className = 'w-full h-full';
      frameRef.current.appendChild(mount);

      let cancelled = false;
      let player: YTPlayer | null = null;
      let timer: number | undefined;

      const report = () => {
        if (!player) return;
        callbacksRef.current.onTimeUpdate?.(player.getCurrentTime(), player.getDuration());
      };
      const stopTimer = () => window.clearInterval(timer);

      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          player = new YT.Player(mount, {
            videoId,
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
              autoplay: 1,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              start: Math.floor(startFromRef.current),
              origin: window.location.origin,
            },
            events: {
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                  stopTimer();
                  timer = window.setInterval(report, POSITION_INTERVAL_MS);
                  report();
                } else if (event.data === YT.PlayerState.PAUSED) {
                  stopTimer();
                  report();
                } else if (event.data === YT.PlayerState.ENDED) {
                  stopTimer();
                  report();
                  callbacksRef.current.onEnded?.();
                }
              },
            },
          });
          playerRef.current = player;
        })
        .catch((err) => console.error('YouTube player failed:', err));

      return () => {
        cancelled = true;
        stopTimer();
        playerRef.current = null;
        player?.destroy();
        mount.remove();
      };
    }, [started, videoId]);

    if (!videoId) return null;

    const resumeLabel = startAt >= 5 ? `متابعة من ${formatAudioTime(startAt)}` : null;

    const start = () => {
      pauseAudio();
      startFromRef.current = startAt;
      setStarted(true);
    };

    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-stone-900">
        {!started && (
          <button
            type="button"
            onClick={start}
            aria-label={resumeLabel ? `${resumeLabel}: ${title}` : `تشغيل: ${title}`}
            className="group absolute inset-0 w-full h-full cursor-pointer"
          >
            {thumb && !posterMissing && (
              <img
                src={thumb}
                alt=""
                decoding="async"
                onLoad={(e) => e.currentTarget.naturalWidth < 121 && setPosterMissing(true)}
                onError={() => setPosterMissing(true)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            )}
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/15 to-transparent" />{/* taste-skill-ignore: a dark scrim over the photograph so the label on it stays readable */}
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="press flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-400 text-stone-950 group-hover:bg-amber-300 transition-colors">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ms-1" />
              </span>
            </span>
            {resumeLabel && (
              <span className="absolute bottom-4 start-4 px-3 py-1.5 rounded-full bg-stone-950/75 text-white text-sm font-semibold tabular-nums">
                {resumeLabel}
              </span>
            )}
          </button>
        )}
        {started && <div ref={frameRef} className="absolute inset-0" />}
      </div>
    );
  }
);
VideoPlayer.displayName = 'VideoPlayer';
