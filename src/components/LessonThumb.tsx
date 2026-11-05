import React, { useState } from 'react';
import { FileText, Headphones, Video } from 'lucide-react';
import { getYouTubeId, getYouTubeThumbnail } from '../lib/youtube';

interface LessonThumbProps {
  youtubeUrl?: string | null;
  audioUrl?: string | null;
  className?: string;
}

// YouTube answers a missing or still-processing picture with a small grey placeholder (120 px wide) instead of an error
const PLACEHOLDER_WIDTH = 121;

// A 16:9 frame for a lesson: the video's own thumbnail, or a calm placeholder for audio-only and text-only lessons.
// When YouTube has no real picture yet, the frame falls back to the site's green with an icon rather than grey dots.
export const LessonThumb: React.FC<LessonThumbProps> = ({ youtubeUrl, audioUrl, className = '' }) => {
  const id = getYouTubeId(youtubeUrl);
  // Tries the usual size, then the medium one, then gives up on pictures
  const [step, setStep] = useState(0);
  const sources = id ? [getYouTubeThumbnail(youtubeUrl), `https://i.ytimg.com/vi/${id}/mqdefault.jpg`] : [];
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
          loading="lazy"
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
