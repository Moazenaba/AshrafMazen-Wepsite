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
    // Tried at once (some browsers allow it for a returning visitor); otherwise it waits for the first tap
    const begin = () => {
      if (audio) return;
      const trial = new Audio(fileSrc(url));
      trial.volume = VOLUME;
      trial.play().then(
        () => {
          if (audio) return trial.pause();
          audio = trial;
          for (const type of GESTURES) window.removeEventListener(type, start);
        },
        () => {}
      );
    };
    // The trial waits until the page has finished loading: the file can be tens of MB, and starting it at once
    // competed with the page itself for the connection (PageSpeed measured a 21 MB download on the home page)
    let timer = 0;
    const later = () => {
      timer = window.setTimeout(begin, 1500);
    };
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later, { once: true });
    for (const type of GESTURES) window.addEventListener(type, start, { once: true, passive: true });
    return () => {
      window.removeEventListener('load', later);
      window.clearTimeout(timer);
      for (const type of GESTURES) window.removeEventListener(type, start);
      audio?.pause();
      audio = null;
    };
  }, [url, playerBusy]);

  return null;
}
