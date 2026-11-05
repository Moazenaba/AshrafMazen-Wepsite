import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { formatAudioTime } from '../utils/helpers';
import { useAudio, type AudioTrack } from '../context/AudioContext';

interface AudioPlayerProps {
  track: AudioTrack;
  startAt?: number;
  onTimeUpdate?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

// What the lesson page can ask of any player: jump to a second
export interface MediaHandle {
  seek(seconds: number): void;
}

export const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

// The lesson page's large player. It drives the site's one audio engine (AudioContext), so the recording
// keeps playing in the bar at the foot of the screen when the visitor moves to another page.
export const AudioPlayer = forwardRef<MediaHandle, AudioPlayerProps>(({ track, startAt = 0, onTimeUpdate, onEnded }, ref) => {
  const audio = useAudio();
  const isCurrent = audio.track?.id === track.id && audio.track?.src === track.src;
  const isPlaying = isCurrent && audio.playing;
  const currentTime = isCurrent ? audio.time : startAt;
  const duration = isCurrent ? audio.duration : 0;

  useImperativeHandle(ref, () => ({
    seek(seconds: number) {
      if (isCurrent) {
        audio.seek(seconds);
        if (!audio.playing) audio.toggle();
      } else {
        audio.play(track, seconds);
      }
    },
  }));

  // Follow the engine for this lesson only: the page's chapters, reading position and auto-next listen here
  const handlers = useRef({ onTimeUpdate, onEnded });
  handlers.current = { onTimeUpdate, onEnded };
  useEffect(
    () =>
      audio.subscribe((event) => {
        if (event.trackId !== track.id) return;
        if (event.type === 'time') handlers.current.onTimeUpdate?.(event.seconds, event.duration);
        else handlers.current.onEnded?.();
      }),
    [audio.subscribe, track.id]
  );

  const togglePlay = () => (isCurrent ? audio.toggle() : audio.play(track, startAt));

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isCurrent) audio.seek(val);
    else audio.play(track, val);
  };

  const iconButton =
    'press w-11 h-11 flex items-center justify-center rounded-full text-emerald-50 hover:bg-white/10 disabled:opacity-40';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-mushaf text-white p-5 sm:p-8">
      <div aria-hidden="true" className="pattern-stars absolute inset-0 opacity-[0.12]" />
      <div className="relative space-y-5">
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={duration || Math.max(startAt, 100)}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isCurrent}
            aria-label="موضع التشغيل"
            aria-valuetext={`${formatAudioTime(currentTime)} من ${formatAudioTime(duration)}`}
            className="w-full h-2 cursor-pointer accent-amber-400 disabled:cursor-default"
          />
          <div className="flex justify-between text-sm text-emerald-100 tabular-nums">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{duration ? formatAudioTime(duration) : '--:--'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-emerald-50">
            <span>السرعة</span>
            <select
              value={audio.rate}
              onChange={(e) => audio.setRate(parseFloat(e.target.value))}
              className="h-11 px-2 rounded-lg bg-emerald-950/60 text-white tabular-nums"
            >
              {SPEED_OPTIONS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}×
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => audio.skip(-10)} disabled={!isCurrent} aria-label="رجوع ١٠ ثوانٍ" title="رجوع ١٠ ثوانٍ" className={iconButton}>
              <RotateCcw className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              className="press w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" aria-hidden="true" /> : <Play className="w-6 h-6 fill-current" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => audio.skip(10)} disabled={!isCurrent} aria-label="تقديم ١٠ ثوانٍ" title="تقديم ١٠ ثوانٍ" className={iconButton}>
              <RotateCw className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={audio.toggleMute}
              aria-label={audio.muted ? 'إلغاء الكتم' : 'كتم الصوت'}
              aria-pressed={audio.muted}
              className={iconButton}
            >
              {audio.muted || audio.volume === 0 ? <VolumeX className="w-5 h-5" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.muted ? 0 : audio.volume}
              onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
              aria-label="مستوى الصوت"
              className="hidden sm:block w-20 cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        <p className="text-sm text-emerald-100/90">يستمر التشغيل عند الانتقال لصفحة أخرى، ويمكنك التحكم فيه من الشريط أسفل الشاشة.</p>
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
