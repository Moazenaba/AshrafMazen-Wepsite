// "شاهد" or "استمع فقط": what the shared player (MediaStage) opens on. A link can ask for one (?mode=listen, as the
// audio page's links do); otherwise the visitor's last choice, kept in this browser.
import { useState } from 'react';

export type MediaMode = 'watch' | 'listen';
const MODE_KEY = 'media_mode';

export function modeFrom(param: string | null, stored: string | null): MediaMode {
  if (param === 'listen' || param === 'watch') return param;
  return stored === 'listen' ? 'listen' : 'watch';
}

function stored(): string | null {
  try {
    return localStorage.getItem(MODE_KEY);
  } catch {
    return null;
  }
}

export function useMediaMode(param: string | null): [MediaMode, (m: MediaMode) => void] {
  const [mode, setMode] = useState<MediaMode>(() => modeFrom(param, stored()));
  const set = (m: MediaMode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // private window: the choice lasts this page only
    }
  };
  return [mode, set];
}
