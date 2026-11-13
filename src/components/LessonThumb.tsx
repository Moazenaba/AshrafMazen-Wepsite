import React, { useState } from 'react';
import { FileText, Headphones, Video } from 'lucide-react';
import { getYouTubeId, getYouTubeThumbnail } from '../lib/youtube';

interface LessonThumbProps {
  youtubeUrl?: string | null;
  audioUrl?: string | null;
  className?: string;
  // The first picture on the page (the largest paint): loaded at once and at high priority, never lazily
  priority?: boolean;
}

// YouTube answers a missing or still-processing picture with a small grey placeholder (120 px wide) instead of an error
const PLACEHOLDER_WIDTH = 121;

// A 16:9 frame for a lesson: the video's own thumbnail, or a calm placeholder for audio-only and text-only lessons.
// When YouTube has no real picture yet, the frame falls back to the site's green with an icon rather than grey dots.
export const LessonThumb: React.FC<LessonThumbProps> = ({ youtubeUrl, audioUrl, className = '', priority = false }) => {
  const id = getYouTubeId(youtubeUrl);
  // Tries the medium size first (320x180, true 16:9, a third of the bytes), then the larger one, then gives up on pictures
  const [step, setStep] = useState(0);
  // WebP first (about a third smaller than the JPEG), then the JPEG for videos YouTube has no WebP for yet
  const sources = id
    ? [`https://i.ytimg.com/vi_webp/${id}/mqdefault.webp`, `https://i.ytimg.com/vi/${id}/mqdefault.jpg`, getYouTubeThumbnail(youtubeUrl)]
    : [];
  const thumb = sources[step] || null;
  const Icon = youtubeUrl ? Video : audioUrl ? Headphones : FileText;

  return (
    <span
      aria-hidden="true"
      className={`relative block aspect-video overflow-hidden rounded-xl bg-mushaf ${className}`}
    >
      {thumb ? (
        <img
          key={thumb}
          src={thumb}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth < PLACEHOLDER_WIDTH) setStep((s) => s + 1);
          }}
          onError={() => setStep((s) => s + 1)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-gold/80">
          <Icon className="w-8 h-8" />
        </span>
      )}
    </span>
  );
};
