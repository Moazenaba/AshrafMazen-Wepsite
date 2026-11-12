// "استمع فقط" for a YouTube video: no picture on the page, only a sound bar (play, seek, ±15 s, speed).
// YouTube's player is kept out of sight and driven through its API; the sound is YouTube's own.
// On phones the sound stops when the screen locks (YouTube's player pauses), unlike a recording kept on the site.
import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Loader2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { loadYouTubeApi, type YTPlayer } from '../lib/youtube';
import { formatAudioTime } from '../utils/helpers';
import { useAudio } from '../context/AudioContext';

const RATES = [1, 1.25, 1.5, 2];

interface Props {
  videoId: string;
  title: string;
  startAt?: number;
  onTimeUpdate?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

export const YoutubeAudioBar: React.FC<Props> = ({ videoId, title, startAt = 0, onTimeUpdate, onEnded }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const callbacks = useRef({ onTimeUpdate, onEnded });
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [failed, setFailed] = useState(false);
  const { pause: pauseAudio } = useAudio();

  useEffect(() => {
    callbacks.current = { onTimeUpdate, onEnded };
  });

  // The hidden player is made on the first press of play (a browser lets sound start only after a press)
  useEffect(() => {
    if (!started || !hostRef.current) return;
    const mount = document.createElement('div');
    hostRef.current.appendChild(mount);
    let cancelled = false;
    let player: YTPlayer | null = null;
    let lastReport = 0;
    const tick = window.setInterval(() => {
      if (!player || !playerRef.current) return;
      const t = player.getCurrentTime();
      const d = player.getDuration();
      setTime(t);
      if (d) setDuration(d);
      if (Math.abs(t - lastReport) >= 3) {
        lastReport = t;
        callbacks.current.onTimeUpdate?.(t, d);
      }
    }, 500);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, start: Math.floor(startAt), origin: window.location.origin },
          events: {
            onReady: () => {
              playerRef.current = player;
              setReady(true);
              player?.playVideo?.();
            },
            onStateChange: (event) => {
              setPlaying(event.data === YT.PlayerState.PLAYING);
              setBuffering(event.data === YT.PlayerState.BUFFERING);
              if (event.data === YT.PlayerState.ENDED) callbacks.current.onEnded?.();
            },
            onError: () => setFailed(true),
          },
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      playerRef.current = null;
      player?.destroy();
      mount.remove();
    };
  }, [started, videoId, startAt]);

  const toggle = () => {
    pauseAudio();
    if (!started) return setStarted(true);
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo?.();
    else p.playVideo?.();
  };

  const seek = (seconds: number) => {
    const target = Math.max(0, Math.min(duration || seconds, seconds));
    setTime(target);
    playerRef.current?.seekTo(target, true);
  };

  const nextRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    playerRef.current?.setPlaybackRate?.(next);
  };

  const loading = started && (!ready || buffering) && !failed;
  const round = 'w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-40';

  return (
    <div className="rounded-xl bg-mushaf text-white p-4 sm:p-5 space-y-3">
      {/* YouTube's player, out of sight: it gives the sound, the bar below is what the visitor uses */}
      <div ref={hostRef} aria-hidden="true" className="fixed bottom-0 left-0 w-px h-px overflow-hidden opacity-0 pointer-events-none" />
      <p className="flex items-center gap-2 text-sm text-gold-soft">
        <Headphones className="w-4 h-4" aria-hidden="true" />
        استماع فقط
      </p>
      {title && <p className="font-semibold leading-snug line-clamp-2">{title}</p>}
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={toggle} aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'} className={`${round} w-14 h-14 bg-gold text-mushaf-deep`}>
          {loading ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> : playing ? <Pause className="w-6 h-6 fill-current" aria-hidden="true" /> : <Play className="w-6 h-6 fill-current ms-0.5" aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => seek(time + 15)} disabled={!ready} aria-label="تقديم ١٥ ثانية" className={`${round} bg-white/10 hover:bg-white/20`}>
          <RotateCw className="w-5 h-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => seek(time - 15)} disabled={!ready} aria-label="رجوع ١٥ ثانية" className={`${round} bg-white/10 hover:bg-white/20`}>
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={nextRate} disabled={!ready} aria-label={`سرعة التشغيل ${rate}`} className="h-11 min-w-14 px-3 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold tabular-nums disabled:opacity-40">
          {rate}×
        </button>
      </div>
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={Math.min(time, Math.max(duration, 1))}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!ready}
          aria-label="موضع الاستماع"
          className="w-full accent-gold"
        />
        <div dir="ltr" className="flex justify-between text-xs text-gold-soft tabular-nums">
          <span>{formatAudioTime(time)}</span>
          <span>{duration ? formatAudioTime(duration) : '--:--'}</span>
        </div>
      </div>
      {failed && <p role="alert" className="text-sm text-red-200">تعذّر تشغيل الصوت. جرّب «شاهد» أو أعد تحميل الصفحة.</p>}
    </div>
  );
};
