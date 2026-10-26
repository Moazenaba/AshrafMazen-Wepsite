import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { formatAudioTime } from '../utils/helpers';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsReady(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio playback failed:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
    setIsReady(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 1000);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  if (!src) {
    return (
      <div className="p-8 text-center bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-500 dark:text-stone-400">
        <p className="text-base font-medium">لم يتم إرفاق ملف صوتي لهذا الدرس بعد.</p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-900/60 relative overflow-hidden">
      {/* Background Islamic Accent Pattern */}
      <div className="absolute inset-0 bg-radial from-emerald-800/20 via-transparent to-transparent pointer-events-none" />

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {title && (
        <div className="mb-5 text-center sm:text-right">
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full inline-block mb-1.5">
            التسجيل الصوتي المباشر
          </span>
          <h4 className="text-lg font-bold text-stone-100">{title}</h4>
        </div>
      )}

      {/* Seek Progress Bar */}
      <div className="space-y-1.5 mb-6">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isReady && !duration}
            className="w-full h-2 bg-emerald-900/80 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
        <div className="flex justify-between items-center text-xs text-emerald-200/80 font-mono">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback rate */}
        <div className="flex items-center gap-1 bg-emerald-900/60 p-1 rounded-xl border border-emerald-800/50">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                playbackRate === speed
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Core Buttons: 10s back, Play/Pause, 10s forward */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleSkip(-10)}
            title="رجوع 10 ثوانٍ"
            className="p-2.5 text-stone-300 hover:text-amber-300 hover:bg-emerald-900/50 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-stone-950" />
            ) : (
              <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(10)}
            title="تقديم 10 ثوانٍ"
            className="p-2.5 text-stone-300 hover:text-amber-300 hover:bg-emerald-900/50 rounded-full transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-stone-300 hover:text-amber-300 rounded-lg"
            title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>
    </div>
  );
};
