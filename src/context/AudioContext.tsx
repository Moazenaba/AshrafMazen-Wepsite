import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getResumeSeconds, markLessonWatched, saveLessonPosition } from '../services/progressService';
import { createPlaybackMeter, trackView } from '../services/analytics';
import { SILENCE, youtubeAudioUrl } from '../lib/youtubeAudio';
import { finite, isSilence, reachable, statsKey, useMediaSession } from './audioEngine';

// One recording the site can play: a lesson's audio (identified by the lesson's id), or a channel video's sound
// (id "yt:<videoId>", with youtubeId: its link lasts minutes and is fetched again if it breaks, see lib/youtubeAudio)
export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  youtubeId?: string;
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
  // A channel video's sound is being fetched; or why it could not be played
  loading: boolean;
  error: string | null;
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
  // For a player that starts somewhere else and moves here (YouTube's sound while this one gets ready, see
  // YoutubeAudioBar): unlock playback from the visitor's tap, load a recording quietly (no track shown), and
  // tell how many seconds of it can be reached so far (0 while it is not the one loaded)
  prime(): void;
  preload(src: string): void;
  reach(src: string): number;
  // The lesson page listens here to follow playback (chapters, the paragraph being read, auto-next)
  subscribe(listener: (event: AudioEvent) => void): () => void;
}

const AudioCtx = createContext<AudioApi | null>(null);

const SAVE_EVERY_SECONDS = 5;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackRef = useRef<AudioTrack | null>(null);
  trackRef.current = track;
  const rateRef = useRef(1);
  rateRef.current = rate;
  // A channel video's link that broke (expired after a long pause) is fetched again once per play
  const retried = useRef(false);

  const emit = (event: AudioEvent) => listeners.current.forEach((l) => l(event));

  // Statistics: the seconds actually heard (a seek adds nothing), counted for the recording that is playing
  const meterRef = useRef<{ key: string; meter: ReturnType<typeof createPlaybackMeter> } | null>(null);
  const meterFor = (id: string) => {
    const key = statsKey(id);
    if (meterRef.current?.key !== key) meterRef.current = { key, meter: createPlaybackMeter('audio', key) };
    return meterRef.current.meter;
  };

  const savePosition = useCallback((force = false) => {
    const audio = audioRef.current;
    const current = trackRef.current;
    if (!audio || !current || !finite(audio.duration) || isSilence(audio)) return;
    if (!force && Math.abs(audio.currentTime - lastSaved.current) < SAVE_EVERY_SECONDS) return;
    saveLessonPosition(current.id, audio.currentTime, audio.duration);
    lastSaved.current = audio.currentTime;
  }, []);

  const start = (audio: HTMLAudioElement, src: string) => {
    audio.src = src;
    audio.playbackRate = rateRef.current;
    audio.load();
    audio.play().catch(() => {});
  };

  // Fetches a channel video's sound again and plays it from `at` seconds, unless the visitor moved on meanwhile
  const playYoutube = useCallback(async (next: AudioTrack, at: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = await youtubeAudioUrl(next.youtubeId!);
      const audio = audioRef.current;
      if (!audio || trackRef.current?.id !== next.id) return;
      pendingStart.current = at;
      start(audio, url);
    } catch (err) {
      if (trackRef.current?.id !== next.id) return;
      setLoading(false);
      setError(err instanceof Error ? err.message : 'تعذّر تشغيل الصوت الآن.');
    }
  }, []);

  const play = useCallback((next: AudioTrack, startAt?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const current = trackRef.current;
    const loaded = current?.src === next.src && !isSilence(audio);
    if (current && current.id === next.id && loaded) {
      if (startAt !== undefined) audio.currentTime = startAt;
      audio.play().catch(() => {});
      return;
    }
    savePosition(true);
    pendingStart.current = startAt ?? getResumeSeconds(next.id);
    lastSaved.current = pendingStart.current;
    retried.current = false;
    setTrack(next);
    setTime(pendingStart.current);
    setDuration(0);
    setError(null);
    setLoading(false);
    // Loaded already (preload): it plays from what has arrived, without fetching it again
    if (audio.src === next.src) {
      audio.playbackRate = rateRef.current;
      seekPending(audio);
      audio.play().catch(() => {});
      return;
    }
    // Called from the visitor's tap, so the browser allows playback to start
    start(audio, next.src);
  }, [savePosition, playYoutube]);

  const prime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    savePosition(true);
    setTrack(null);
    setPlaying(false);
    start(audio, SILENCE);
  }, [savePosition]);

  const preload = useCallback((src: string) => {
    const audio = audioRef.current;
    if (!audio || trackRef.current || audio.src === src) return;
    audio.preload = 'auto';
    audio.src = src;
    audio.load();
  }, []);

  const reach = useCallback((src: string) => {
    const audio = audioRef.current;
    return audio && audio.src === src && !audio.error ? reachable(audio) : 0;
  }, []);

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
    setLoading(false);
    setError(null);
    setTime(0);
    setDuration(0);
  }, [savePosition]);

  const subscribe = useCallback((listener: (event: AudioEvent) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useMediaSession(audioRef, track, { skip, seek, close });

  // Keep the place when the visitor closes or reloads the tab
  useEffect(() => {
    const onHide = () => savePosition(true);
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [savePosition]);

  const api = useMemo<AudioApi>(
    () => ({ track, playing, time, duration, rate, muted, volume, loading, error, play, toggle, pause, seek, skip, setRate, setVolume, toggleMute, close, prime, preload, reach, subscribe }),
    [track, playing, time, duration, rate, muted, volume, loading, error, play, toggle, pause, seek, skip, setRate, setVolume, toggleMute, close, prime, preload, reach, subscribe]
  );

  // The place to resume from is reached once the browser has that part (a channel video's sound cannot jump
  // ahead of what has arrived, and arrives within seconds)
  const seekPending = (audio: HTMLAudioElement) => {
    const at = pendingStart.current;
    if (!at || isSilence(audio)) return;
    const length = finite(audio.duration);
    if (length && at >= length - 1) {
      pendingStart.current = 0;
      return;
    }
    if (reachable(audio) >= at) {
      audio.currentTime = at;
      pendingStart.current = 0;
    }
  };

  return (
    <AudioCtx.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          if (isSilence(audio)) return;
          setDuration(finite(audio.duration));
          seekPending(audio);
        }}
        onDurationChange={(e) => !isSilence(e.currentTarget) && setDuration(finite(e.currentTarget.duration))}
        onProgress={(e) => seekPending(e.currentTarget)}
        onPlaying={(e) => !isSilence(e.currentTarget) && setLoading(false)}
        onError={(e) => {
          const audio = e.currentTarget;
          const current = trackRef.current;
          if (!current || isSilence(audio) || !audio.src) return;
          // A channel video's link lasts minutes: after a long pause it is fetched again and resumed in place
          if (current.youtubeId && !retried.current) {
            retried.current = true;
            playYoutube(current, audio.currentTime || time);
            return;
          }
          setLoading(false);
          setError('تعذّر تشغيل التسجيل الآن. حاول بعد قليل.');
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          const current = trackRef.current;
          if (isSilence(audio)) return;
          setTime(audio.currentTime);
          seekPending(audio);
          if (!current) return;
          if (!audio.paused) meterFor(current.id).update(audio.currentTime);
          savePosition();
          emit({ type: 'time', trackId: current.id, seconds: audio.currentTime, duration: finite(audio.duration) });
          if ('mediaSession' in navigator && finite(audio.duration) && navigator.mediaSession.setPositionState) {
            try {
              navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate });
            } catch {}
          }
        }}
        onPlay={(e) => {
          if (isSilence(e.currentTarget)) return;
          setPlaying(true);
          const current = trackRef.current;
          if (current) {
            trackView('audio', statsKey(current.id));
            // Start counting from where playback resumes, so the time paused is never added
            meterFor(current.id).reset();
          }
        }}
        onPause={(e) => {
          if (isSilence(e.currentTarget)) return;
          setPlaying(false);
          savePosition(true);
          meterRef.current?.meter.reset();
        }}
        onEnded={(e) => {
          if (isSilence(e.currentTarget)) return;
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
