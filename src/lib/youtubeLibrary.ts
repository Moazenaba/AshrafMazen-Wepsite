import { useEffect, useState } from 'react';
import type { LibraryPlaylist } from '../data/youtube-library';
import { getYoutubeOverrides, type YoutubeOverrides } from '../services/dataService';

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
      overrides = overrides ?? { hiddenPlaylists: [], hiddenVideos: [], videoTitles: {}, playlistTitles: {}, extraPlaylists: [] };
    }));
}

// Called by the admin after saving, so every open page follows
export function overridesChanged(next: YoutubeOverrides): void {
  overrides = next;
  overridesLoading = Promise.resolve();
  window.dispatchEvent(new Event(OVERRIDES_EVENT));
}

// The library as visitors see it: without what the admin hid, and with the titles the admin changed
export function applyOverrides(library: LibraryPlaylist[], o: YoutubeOverrides | null): LibraryPlaylist[] {
  if (!o) return library;
  const hiddenPlaylists = new Set(o.hiddenPlaylists);
  const hiddenVideos = new Set(o.hiddenVideos);
  return library
    .filter((p) => !hiddenPlaylists.has(p.id))
    .map((p) => {
      const videos = p.videos
        .filter((v) => !hiddenVideos.has(v.id))
        .map((v) => (o.videoTitles[v.id] ? { ...v, title: o.videoTitles[v.id] } : v));
      return {
        ...p,
        title: o.playlistTitles[p.id] || p.title,
        videos,
        count: `${videos.length} فيديو`,
        // The playlist's picture must be a video that is still shown
        latestVideoId: videos.some((v) => v.id === p.latestVideoId) ? p.latestVideoId : videos[0]?.id || p.latestVideoId,
      };
    })
    .filter((p) => p.videos.length > 0);
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

    fetch(LIBRARY_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { playlists?: LibraryPlaylist[] } | null) => {
        if (!data?.playlists?.length) return;
        cached = data.playlists;
        fromBackend = true;
        if (active) setLibrary(data.playlists);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return library;
}

// The whole library, hidden items included: for the admin screen that manages them
export function useRawYoutubeLibrary(): LibraryPlaylist[] {
  return useRawLibrary();
}

// The library as visitors see it
export function useYoutubeLibrary(): LibraryPlaylist[] {
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
