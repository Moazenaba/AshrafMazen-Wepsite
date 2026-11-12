// The reels as the site shows them: the channel's Shorts from /api/youtube-shorts, with the admin's settings applied.
import { useEffect, useState } from 'react';
import { getReelsSettings } from '../services/data/reels';
import { EMPTY_REELS, visibleReels, type ReelItem, type ReelsSettings } from './reelsRules';

const SHORTS_URL = '/api/youtube-shorts';
const CHANGED = 'reels_settings_changed';

let fetchedCache: Promise<ReelItem[]> | null = null;
let settingsCache: ReelsSettings | null = null;

export function fetchShorts(): Promise<ReelItem[]> {
  return (fetchedCache ??= fetch(SHORTS_URL)
    .then((r) => (r.ok ? r.json() : { shorts: [] }))
    .then((data: { shorts?: ReelItem[] }) => (Array.isArray(data?.shorts) ? data.shorts : []))
    .catch(() => []));
}

const loadSettings = () =>
  settingsCache ? Promise.resolve(settingsCache) : getReelsSettings().then((s) => (settingsCache = s)).catch(() => EMPTY_REELS);

// Called by the admin after saving, so open pages follow
export function reelsChanged(next: ReelsSettings): void {
  settingsCache = next;
  window.dispatchEvent(new Event(CHANGED));
}

export function useReels(): { reels: ReelItem[]; loaded: boolean } {
  const [state, setState] = useState<{ reels: ReelItem[]; loaded: boolean }>({ reels: [], loaded: false });
  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.all([fetchShorts(), loadSettings()]).then(([fetched, settings]) => {
        if (alive) setState({ reels: visibleReels(fetched, settings), loaded: true });
      });
    load();
    window.addEventListener(CHANGED, load);
    return () => {
      alive = false;
      window.removeEventListener(CHANGED, load);
    };
  }, []);
  return state;
}
