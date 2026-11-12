// A video file kept on the site, in a plain <video>, reporting its position like the other players.
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { MediaHandle } from '../AudioPlayer';

interface Props {
  src: string;
  title: string;
  startAt: number;
  onTimeUpdate: (seconds: number, duration: number) => void;
  onEnded: () => void;
}

export const FilePlayer = forwardRef<MediaHandle, Props>(({ src, title, startAt, onTimeUpdate, onEnded }, ref) => {
  const el = useRef<HTMLVideoElement>(null);
  const last = useRef(0);

  useImperativeHandle(ref, () => ({
    seek(seconds: number) {
      if (!el.current) return;
      el.current.currentTime = seconds;
      el.current.play().catch(() => {});
    },
  }));

  return (
    <video
      ref={el}
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      onLoadedMetadata={() => {
        if (el.current && startAt > 0 && startAt < (el.current.duration || Infinity) - 5) el.current.currentTime = startAt;
      }}
      onTimeUpdate={() => {
        const v = el.current;
        if (!v || Math.abs(v.currentTime - last.current) < 3) return;
        last.current = v.currentTime;
        onTimeUpdate(v.currentTime, v.duration || 0);
      }}
      onEnded={onEnded}
      className="w-full aspect-video rounded-xl bg-black"
    />
  );
});
