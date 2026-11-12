// "استمع فقط" for a YouTube video: no picture on the page, only a sound bar (play, seek, ±15 s, speed).
// It starts at once on YouTube's own player, kept out of sight. Meanwhile the same sound is fetched for the site's
// own player (lib/youtubeAudio, a few seconds to half a minute); once enough of it has arrived, playback moves
// there at the same second. From then on it goes on with the screen off and shows in the phone's notifications
// (YouTube's player stops when the screen locks). If that sound cannot be had, YouTube simply keeps playing.
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Headphones, Loader2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { loadYouTubeApi, type YTPlayer } from '../lib/youtube';
import { youtubeAudioUrl } from '../lib/youtubeAudio';
import { formatAudioTime } from '../utils/helpers';
import { useAudio, type AudioTrack } from '../context/AudioContext';
import { AudioPlayer, type MediaHandle } from './AudioPlayer';

const RATES = [1, 1.25, 1.5, 2];
// Seconds of the site's sound that must be ready past the current place before playback moves there
const AHEAD = 3;

interface Props {
  videoId: string;
  title: string;
  // Where the sound is remembered (progress, statistics) and what the notification shows
  trackId: string;
  subtitle?: string;
  href?: string;
  startAt?: number;
  onTimeUpdate?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

export const YoutubeAudioBar = forwardRef<MediaHandle, Props>(({ videoId, title, trackId, subtitle, href, startAt = 0, onTimeUpdate, onEnded }, ref) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const siteRef = useRef<MediaHandle>(null);
  const callbacks = useRef({ onTimeUpdate, onEnded });
  const engine = useAudio();
  const engineRef = useRef(engine);
  const urlRef = useRef<string | null>(null);
  const [from, setFrom] = useState(startAt);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [failed, setFailed] = useState(false);
  // The track once playback has moved to the site's own player
  const [moved, setMoved] = useState<AudioTrack | null>(null);
  const rateRef = useRef(rate);

  useEffect(() => {
    callbacks.current = { onTimeUpdate, onEnded };
    engineRef.current = engine;
    rateRef.current = rate;
  });

  // The hidden player is made on the first press of play (a browser lets sound start only after a press)
  useEffect(() => {
    if (!started || moved || !hostRef.current) return;
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
      // Move to the site's player once its sound reaches a little past where YouTube is
      const url = urlRef.current;
      if (url && d && engineRef.current.reach(url) >= Math.min(t + AHEAD, d - 1)) {
        const wasPlaying = player.getPlayerState?.() === 1;
        player.pauseVideo?.();
        const track: AudioTrack = { id: trackId, title, subtitle, src: url, youtubeId: videoId, href };
        engineRef.current.setRate(rateRef.current);
        engineRef.current.play(track, t);
        if (!wasPlaying) window.setTimeout(() => engineRef.current.pause(), 0);
        setFrom(t);
        setMoved(track);
      }
    }, 500);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, start: Math.floor(from), origin: window.location.origin },
          events: {
            onReady: () => {
              playerRef.current = player;
              setReady(true);
              player?.setPlaybackRate?.(rateRef.current);
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
    // `from` is read once when the player is made; later jumps go through seekTo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, moved, videoId]);

  const begin = () => {
    // Unlocks the site's player from this tap (it takes over later, without a tap) and stops whatever it played
    engine.prime();
    setStarted(true);
    youtubeAudioUrl(videoId)
      .then((url) => {
        urlRef.current = url;
        engineRef.current.preload(url);
      })
      .catch(() => {
        // No sound for the site's player: YouTube keeps playing (it stops when the screen locks)
      });
  };

  const toggle = () => {
    if (!started) return begin();
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo?.();
    else p.playVideo?.();
  };

  const seek = (seconds: number) => {
    const target = Math.max(0, Math.min(duration || seconds, seconds));
    setTime(target);
    if (!started) {
      setFrom(target);
      return begin();
    }
    playerRef.current?.seekTo(target, true);
  };

  // The lesson page's chapters and transcript jump here, before or after the move
  useImperativeHandle(ref, () => ({
    seek(seconds: number) {
      if (moved) siteRef.current?.seek(seconds);
      else seek(seconds);
    },
  }));

  if (moved) {
    return (
      <div className="space-y-2">
        <AudioPlayer ref={siteRef} track={moved} startAt={from} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
        <p className="text-xs text-stone-600 dark:text-stone-400">يكمل التشغيل لو قفلت الشاشة أو خرجت من الموقع، وتتحكم فيه من الإشعارات.</p>
      </div>
    );
  }

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
});
