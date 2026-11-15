import { useEffect, useState } from 'react';
import type { LibraryPlaylist } from '../data/youtube-library';
import { getYoutubeOverrides, type YoutubeOverrides } from '../services/dataService';
import { EMPTY_OVERRIDES } from '../services/data/youtube';
import { applyOverrides, type SitePlaylist } from './libraryOverrides';
import { timedFetch } from './timedFetch';

const LIBRARY_URL = '/api/youtube-library';
const OVERRIDES_EVENT = 'youtube_overrides_changed';

// The newest library seen in this visit, so a second page shows it at once
let cached: LibraryPlaylist[] | null = null;

// The bundled library is a separate file, fetched only when a page asks for the playlists,
// so it stays out of the first download of the site
let bundled: Promise<LibraryPlaylist[]> | null = null;
const loadBundled = () => (bundled ??= import('../data/youtube-library').then((m) => m.YOUTUBE_LIBRARY));

// What the admin changed about the channel's playlists and videos (hidden ones, new titles)
let overrides: YoutubeOverrides | null = null;
let overridesLoading: Promise<void> | null = null;

function loadOverrides(force = false): Promise<void> {
  if (force) overridesLoading = null;
  return (overridesLoading ??= getYoutubeOverrides()
    .then((value) => {
      overrides = value;
    })
    .catch(() => {
      // Nothing saved or unreachable: the library shows as it is
      overrides = overrides ?? EMPTY_OVERRIDES;
    }));
}

// Called by the admin after saving, so every open page follows
export function overridesChanged(next: YoutubeOverrides): void {
  overrides = next;
  overridesLoading = Promise.resolve();
  window.dispatchEvent(new Event(OVERRIDES_EVENT));
}

export { applyOverrides, EXTRA_VIDEOS_LIST } from './libraryOverrides';

// The playlists the admin added, as the backend's cache key: a new one gives a new address, so neither the
// server's stored copy nor the CDN's can keep showing the library without it
const extrasKey = (o: YoutubeOverrides | null) =>
  (o?.extraPlaylists ?? [])
    .map((p) => `${p.id}:${p.title}`)
    .sort()
    .join('|');

// One request per address, shared by every component that asks for the library at the same time (the menu, the home
// page, the search and the video lists each call useYoutubeLibrary, and each used to send its own identical request: 3 to 5
// per page, nearly all answered "304 not modified"). The answer is kept for 30 seconds, so moving between pages is free too.
const SHARE_MS = 30_000;
const requests = new Map<string, { at: number; result: Promise<LibraryPlaylist[] | null> }>();

function fetchBackendLibrary(): Promise<LibraryPlaylist[] | null> {
  return loadOverrides().then(() => {
    const url = `${LIBRARY_URL}?p=${encodeURIComponent(extrasKey(overrides))}`;
    const known = requests.get(url);
    if (known && Date.now() - known.at < SHARE_MS) return known.result;
    const result = timedFetch(url)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { playlists?: LibraryPlaylist[] } | null) => (data?.playlists?.length ? data.playlists : null))
      .catch(() => null);
    requests.set(url, { at: Date.now(), result });
    // A failed or empty answer is not kept, so the next page tries again
    void result.then((playlists) => {
      if (!playlists && requests.get(url)?.result === result) requests.delete(url);
    });
    return result;
  });
}

// The library from the backend, which keeps it cached and up to date with YouTube's newest videos.
// The bundled library is loaded alongside it and shown while the backend answers; if the backend is not
// reachable (for example during local development), the bundled library stays.
function useRawLibrary(): LibraryPlaylist[] {
  const [library, setLibrary] = useState<LibraryPlaylist[]>(cached ?? []);

  useEffect(() => {
    let active = true;
    let fromBackend = false;

    loadBundled()
      .then((playlists) => {
        if (active && !fromBackend && !cached) setLibrary(playlists);
      })
      .catch(() => {});

    const fetchLibrary = () =>
      fetchBackendLibrary().then((playlists) => {
        if (!playlists) return;
        cached = playlists;
        fromBackend = true;
        if (active) setLibrary(playlists);
      });

    fetchLibrary();
    // The admin saved new settings (perhaps a new playlist): ask again with the new key
    window.addEventListener(OVERRIDES_EVENT, fetchLibrary);
    return () => {
      active = false;
      window.removeEventListener(OVERRIDES_EVENT, fetchLibrary);
    };
  }, []);

  return library;
}

// The whole library, hidden items included: for the admin screen that manages them
export function useRawYoutubeLibrary(): LibraryPlaylist[] {
  return useRawLibrary();
}

// The library as visitors see it
export function useYoutubeLibrary(): SitePlaylist[] {
  const raw = useRawLibrary();
  const [, bump] = useState(0);

  useEffect(() => {
    let active = true;
    loadOverrides().then(() => active && bump((n) => n + 1));
    const onChange = () => bump((n) => n + 1);
    window.addEventListener(OVERRIDES_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(OVERRIDES_EVENT, onChange);
    };
  }, []);

  return applyOverrides(raw, overrides);
}
