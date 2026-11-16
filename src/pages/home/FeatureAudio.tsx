import { useEffect } from 'react';
import { useAudio } from '../../context/AudioContext';
import { fileSrc } from '../../lib/fileLinks';

// What a browser accepts as the visitor's own gesture (a scroll is not one)
const GESTURES = ['click', 'keydown', 'touchend'] as const;
const VOLUME = 0.4;

// The sound the admin attached to the home card: no button, it plays quietly in the background from the visitor's first
// tap (browsers never let a page start sound by itself), once, and stops when the visitor leaves the home page or starts
// something of their own in the site's player.
export function FeatureAudio({ url }: { url: string }) {
  const player = useAudio();
  const playerBusy = player.playing;

  useEffect(() => {
    if (!url || playerBusy) return;
    let audio: HTMLAudioElement | null = null;
    const start = () => {
      if (audio) return;
      audio = new Audio(fileSrc(url));
      audio.volume = VOLUME;
      audio.play().catch(() => {
        audio = null;
      });
    };
    for (const type of GESTURES) window.addEventListener(type, start, { once: true, passive: true });
    return () => {
      for (const type of GESTURES) window.removeEventListener(type, start);
      audio?.pause();
      audio = null;
    };
  }, [url, playerBusy]);

  return null;
}
