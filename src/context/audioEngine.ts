// Small pieces of the site's audio engine (AudioContext): helpers about the one <audio> element, and the
// phone's notification / lock-screen controls.
import { useEffect, type RefObject } from 'react';
import { isSilenceSrc, isYoutubeTrackId } from '../lib/youtubeAudio';
import type { AudioTrack } from './AudioContext';

const ARTIST = 'الشيخ أشرف مازن';

// The key statistics count under: a lesson's, or the channel video's (the same its video page uses)
export const statsKey = (id: string) => (isYoutubeTrackId(id) ? id : `lesson:${id}`);
// The silent sound played from a tap to unlock playback (see SILENCE) is never a real recording
export const isSilence = (audio: HTMLAudioElement) => isSilenceSrc(audio.src);
// A recording sent while it is made has no length yet (Infinity): treated as unknown
export const finite = (n: number) => (Number.isFinite(n) ? n : 0);
// How far into the recording the player can jump: what has arrived, or all of it when the server allows jumps
export const reachable = (audio: HTMLAudioElement) => (audio.seekable.length ? audio.seekable.end(audio.seekable.length - 1) : 0);

// Notification, lock-screen and headphone controls for the track that is playing, with its title (and the video's
// picture for a channel video)
export function useMediaSession(
  audioRef: RefObject<HTMLAudioElement | null>,
  track: AudioTrack | null,
  controls: { skip(delta: number): void; seek(seconds: number): void; close(): void }
): void {
  const { skip, seek, close } = controls;
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    if (!track) {
      session.metadata = null;
      return;
    }
    const artwork = track.youtubeId ? [{ src: `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' }] : [];
    session.metadata = new MediaMetadata({ title: track.title, artist: ARTIST, album: track.subtitle || '', artwork });
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
    return () =>
      handlers.forEach(([action]) => {
        try {
          session.setActionHandler(action, null);
        } catch {}
      });
  }, [audioRef, track, skip, seek, close]);
}
