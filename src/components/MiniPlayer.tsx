import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { formatAudioTime } from '../utils/helpers';
import { SPEED_OPTIONS } from './AudioPlayer';

// The height the bar takes at the foot of the screen; the page adds the same space below its content
export const MINI_PLAYER_SPACE = 'calc(4.75rem + env(safe-area-inset-bottom))';

// The recording that is playing, pinned to the foot of every page: the visitor can browse the site,
// lock the phone, and come back to the lesson from its title
export const MiniPlayer: React.FC = () => {
  const audio = useAudio();
  if (!audio.track) return null;

  const { track, playing, time, duration, rate } = audio;
  const nextRate = SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(rate) + 1) % SPEED_OPTIONS.length];
  const control =
    'press shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-gold-soft hover:bg-mushaf-deep focus-visible:bg-mushaf-deep transition-colors';

  return (
    <section
      aria-label="المشغل الصوتي"
      className="fixed inset-x-0 bottom-0 z-40 bg-mushaf text-gold-soft border-t-2 border-gold"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Where the recording is: a thin bar the visitor can also drag to jump */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={Math.min(time, duration || 1)}
        onChange={(e) => audio.seek(parseFloat(e.target.value))}
        aria-label="موضع التشغيل"
        aria-valuetext={`${formatAudioTime(time)} من ${formatAudioTime(duration)}`}
        className="block w-full h-1.5 -mt-1 cursor-pointer accent-gold"
      />
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 h-[4.25rem] flex items-center gap-2 sm:gap-3">
        {/* A channel video's sound takes a few seconds to arrive; after a failure the button tries again */}
        <button
          type="button"
          onClick={() => (audio.error ? audio.play(track) : audio.toggle())}
          disabled={audio.loading}
          aria-busy={audio.loading}
          aria-label={audio.loading ? 'جارٍ تجهيز الصوت' : audio.error ? 'إعادة المحاولة' : playing ? 'إيقاف مؤقت' : 'تشغيل'}
          className="press shrink-0 w-12 h-12 rounded-full bg-gold hover:bg-gold-soft text-mushaf-deep flex items-center justify-center disabled:cursor-progress"
        >
          {audio.loading ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : audio.error ? (
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
          ) : playing ? (
            <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="w-5 h-5 fill-current ms-0.5" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          {track.href ? (
            <Link to={track.href} className="block truncate font-semibold text-white hover:text-gold-soft">
              {track.title}
            </Link>
          ) : (
            <p className="truncate font-semibold text-white">{track.title}</p>
          )}
          <p role={audio.error ? 'alert' : undefined} className="truncate text-xs sm:text-sm text-gold-soft/85 tabular-nums">
            {audio.error
              ? audio.error
              : audio.loading
                ? 'جارٍ تجهيز الصوت… ثواني قليلة'
                : `${formatAudioTime(time)} / ${duration ? formatAudioTime(duration) : '--:--'}${track.subtitle ? ` · ${track.subtitle}` : ''}`}
          </p>
        </div>

        <button type="button" onClick={() => audio.skip(-10)} aria-label="رجوع ١٠ ثوانٍ" title="رجوع ١٠ ثوانٍ" className={`${control} hidden min-[400px]:flex`}>
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => audio.skip(10)} aria-label="تقديم ١٠ ثوانٍ" title="تقديم ١٠ ثوانٍ" className={`${control} hidden min-[400px]:flex`}>
          <RotateCw className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => audio.setRate(nextRate)}
          aria-label={`سرعة التشغيل ${rate}×، اضغط للتغيير إلى ${nextRate}×`}
          className={`${control} text-sm font-bold tabular-nums`}
        >
          {rate}×
        </button>
        <button type="button" onClick={audio.close} aria-label="إغلاق المشغل" title="إغلاق" className={control}>
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
