// The welcome sound the admin set (services/data/welcomeSoundRules): once per visit, on the visitor's first tap
// anywhere (browsers never let a page start sound by itself), at the admin's volume, with a button to stop it.
// It stops by itself when the visitor plays a lesson or opens a page that plays something (a lesson, a video, reels).
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, X } from 'lucide-react';
import { getSiteContent } from '../services/data/siteContent';
import { isQuietPage, MAX_WELCOME_SECONDS, shouldLoadWelcome, shouldWelcome, type WelcomeSound as Sound } from '../services/data/welcomeSoundRules';
import { useAudio } from '../context/AudioContext';
import { fileSrc } from '../lib/fileLinks';

const PLAYED_KEY = 'welcome_played';
// What a browser accepts as the visitor's own gesture (a scroll is not one)
const GESTURES = ['click', 'keydown', 'touchend'] as const;

const played = () => {
  try {
    return sessionStorage.getItem(PLAYED_KEY) === '1';
  } catch {
    return false;
  }
};
const markPlayed = () => {
  try {
    sessionStorage.setItem(PLAYED_KEY, '1');
  } catch {
    // private window: it may play again on reload, nothing worse
  }
};

export const WelcomeSound: React.FC = () => {
  const { pathname } = useLocation();
  const firstPath = useRef(pathname);
  const [sound, setSound] = useState<Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const engine = useAudio();

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  };

  // Only a recording whose saved length is a short greeting is ever fetched (the admin saves the length with it);
  // anything longer, such as a lesson saved here by mistake, or a length never saved, costs visitors nothing
  useEffect(() => {
    if (played() || isQuietPage(firstPath.current)) return;
    let alive = true;
    getSiteContent().then((c) => {
      if (!alive || !c.welcome.enabled || !c.welcome.url) return;
      if (shouldLoadWelcome(c.welcome.seconds)) setSound(c.welcome);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Wait for the first tap, then play once
  useEffect(() => {
    if (!sound || !shouldWelcome(sound, played(), firstPath.current, window.location.pathname)) return;
    const onGesture = () => {
      if (audioRef.current || !shouldWelcome(sound, played(), firstPath.current, window.location.pathname)) return;
      const audio = new Audio(fileSrc(sound.url));
      audio.volume = sound.volume / 100;
      audio.onended = stop;
      audio.onerror = stop;
      // Never longer than a greeting, whatever the file
      audio.ontimeupdate = () => {
        if (audio.currentTime >= MAX_WELCOME_SECONDS) stop();
      };
      audioRef.current = audio;
      audio
        .play()
        .then(() => {
          markPlayed();
          setPlaying(true);
          remove();
        })
        // Not taken as a gesture by this browser: the next tap tries again
        .catch(() => (audioRef.current = null));
    };
    const remove = () => GESTURES.forEach((g) => document.removeEventListener(g, onGesture, true));
    GESTURES.forEach((g) => document.addEventListener(g, onGesture, true));
    return remove;
  }, [sound]);

  // A lesson started, or the visitor moved to a page that plays something itself: the welcome gives way
  useEffect(() => {
    if (playing && (engine.playing || isQuietPage(pathname))) stop();
  }, [playing, engine.playing, pathname]);

  useEffect(() => () => audioRef.current?.pause(), []);

  if (!playing) return null;
  return (
    <div role="status" className="fixed z-50 bottom-[calc(1rem+env(safe-area-inset-bottom))] inset-x-0 flex justify-center pointer-events-none">
      <div className="pointer-events-auto inline-flex items-center gap-2 ps-4 pe-1.5 h-12 rounded-full bg-mushaf text-gold-soft shadow-lg border border-gold/60">
        <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold">صوت الترحيب</span>
        <button type="button" onClick={stop} aria-label="إيقاف صوت الترحيب" className="press w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
