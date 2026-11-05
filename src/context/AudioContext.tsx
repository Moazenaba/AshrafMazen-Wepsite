import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getResumeSeconds, markLessonWatched, saveLessonPosition } from '../services/progressService';
import { createPlaybackMeter, trackView } from '../services/analytics';

// One recording the site can play: a lesson's audio, identified by the lesson's id
export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  // Where the title in the mini player leads back to
  href?: string;
}

type AudioEvent = { type: 'time'; trackId: string; seconds: number; duration: number } | { type: 'ended'; trackId: string };

interface AudioApi {
  track: AudioTrack | null;
  playing: boolean;
  time: number;
  duration: number;
  rate: number;
  muted: boolean;
  volume: number;
  // Starts a track (at startAt, or where the visitor left it last time), or resumes it if it is already loaded
  play(track: AudioTrack, startAt?: number): void;
  toggle(): void;
  pause(): void;
  seek(seconds: number): void;
  skip(delta: number): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  close(): void;
  // The lesson page listens here to follow playback (chapters, the paragraph being read, auto-next)
  subscribe(listener: (event: AudioEvent) => void): () => void;
}

const AudioCtx = createContext<AudioApi | null>(null);

const SAVE_EVERY_SECONDS = 5;
const ARTIST = 'الشيخ أشرف مازن';

// The site's one audio element lives here, above the routes, so a recording keeps playing while the visitor
// moves between pages. Phones get lock-screen controls through the Media Session API, and playback continues
// with the screen off for as long as the browser keeps the tab.
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listeners = useRef(new Set<(event: AudioEvent) => void>());
  const pendingStart = useRef(0);
  const lastSaved = useRef(0);

  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);

  const trackRef = useRef<AudioTrack | null>(null);
  trackRef.current = track;

  const emit = (event: AudioEvent) => listeners.current.forEach((l) => l(event));

  // Statistics: the seconds actually heard (a seek adds nothing), counted for the recording that is playing
  const meterRef = useRef<{ key: string; meter: ReturnType<typeof createPlaybackMeter> } | null>(null);
  const meterFor = (id: string) => {
    const key = `lesson:${id}`;
    if (meterRef.current?.key !== key) meterRef.current = { key, meter: createPlaybackMeter('audio', key) };
    return meterRef.current.meter;
  };

  const savePosition = useCallback((force = false) => {
    const audio = audioRef.current;
    const current = trackRef.current;
    if (!audio || !current || !audio.duration) return;
    if (!force && Math.abs(audio.currentTime - lastSaved.current) < SAVE_EVERY_SECONDS) return;
    saveLessonPosition(current.id, audio.currentTime, audio.duration);
    lastSaved.current = audio.currentTime;
  }, []);

  const play = useCallback((next: AudioTrack, startAt?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const current = trackRef.current;
    if (current && current.id === next.id && current.src === next.src) {
      if (startAt !== undefined) audio.currentTime = startAt;
      audio.play().catch(() => {});
      return;
    }
    savePosition(true);
    pendingStart.current = startAt ?? getResumeSeconds(next.id);
    lastSaved.current = pendingStart.current;
    setTrack(next);
    setTime(pendingStart.current);
    setDuration(0);
    audio.src = next.src;
    audio.playbackRate = rate;
    audio.load();
    // Called from the visitor's tap, so the browser allows playback to start
    audio.play().catch(() => {});
  }, [rate, savePosition]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !trackRef.current) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = audio.duration || seconds;
    audio.currentTime = Math.min(Math.max(seconds, 0), max);
    setTime(audio.currentTime);
  }, []);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (audio) seek(audio.currentTime + delta);
  }, [seek]);

  const setRate = useCallback((next: number) => {
    setRateState(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, []);

  const setVolume = useCallback((next: number) => {
    const audio = audioRef.current;
    setVolumeState(next);
    if (!audio) return;
    audio.volume = next;
    audio.muted = next === 0;
    setMuted(next === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    savePosition(true);
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setTrack(null);
    setPlaying(false);
    setTime(0);
    setDuration(0);
  }, [savePosition]);

  const subscribe = useCallback((listener: (event: AudioEvent) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // Lock-screen and headphone controls, and the title shown there
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    if (!track) {
      session.metadata = null;
      return;
    }
    session.metadata = new MediaMetadata({ title: track.title, artist: ARTIST, album: track.subtitle || '' });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => audioRef.current?.play().catch(() => {})],
      ['pause', () => audioRef.current?.pause()],
      ['seekbackward', (d) => skip(-(d.seekOffset || 10))],
      ['seekforward', (d) => skip(d.seekOffset || 10)],
      ['seekto', (d) => d.seekTime !== undefined && seek(d.seekTime)],
      ['stop', () => close()],
    ];
    handlers.forEach(([action, handler]) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // An action this browser does not support
      }
    });
    return () => handlers.forEach(([action]) => {
      try {
        session.setActionHandler(action, null);
      } catch {}
    });
  }, [track, skip, seek, close]);

  // Keep the place when the visitor closes or reloads the tab
  useEffect(() => {
    const onHide = () => savePosition(true);
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [savePosition]);

  const api = useMemo<AudioApi>(
    () => ({ track, playing, time, duration, rate, muted, volume, play, toggle, pause, seek, skip, setRate, setVolume, toggleMute, close, subscribe }),
    [track, playing, time, duration, rate, muted, volume, play, toggle, pause, seek, skip, setRate, setVolume, toggleMute, close, subscribe]
  );

  return (
    <AudioCtx.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
          const start = pendingStart.current;
          if (start > 0 && start < (audio.duration || 0) - 1) audio.currentTime = start;
          pendingStart.current = 0;
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          const current = trackRef.current;
          setTime(audio.currentTime);
          if (!current) return;
          if (!audio.paused) meterFor(current.id).update(audio.currentTime);
          savePosition();
          emit({ type: 'time', trackId: current.id, seconds: audio.currentTime, duration: audio.duration || 0 });
          if ('mediaSession' in navigator && audio.duration && navigator.mediaSession.setPositionState) {
            try {
              navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate });
            } catch {}
          }
        }}
        onPlay={() => {
          setPlaying(true);
          const current = trackRef.current;
          if (current) {
            trackView('audio', `lesson:${current.id}`);
            // Start counting from where playback resumes, so the time paused is never added
            meterFor(current.id).reset();
          }
        }}
        onPause={() => {
          setPlaying(false);
          savePosition(true);
          meterRef.current?.meter.reset();
        }}
        onEnded={() => {
          const current = trackRef.current;
          setPlaying(false);
          if (!current) return;
          markLessonWatched(current.id);
          emit({ type: 'ended', trackId: current.id });
        }}
      />
    </AudioCtx.Provider>
  );
};

export function useAudio(): AudioApi {
  const api = useContext(AudioCtx);
  if (!api) throw new Error('useAudio must be used inside AudioProvider');
  return api;
}
