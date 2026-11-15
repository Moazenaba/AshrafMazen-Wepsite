// The lock screen's and notification's progress bar: tells the browser where the playing audio is.
export function updateMediaPosition(audio: HTMLAudioElement): void {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate });
  } catch {
    // some browsers refuse a position past the end; the bar simply does not move
  }
}
