import React from 'react';
import { FileText, Headphones, Video } from 'lucide-react';

interface MediaIconsProps {
  youtubeUrl?: string | null;
  audioUrl?: string | null;
  transcript?: string | null;
  className?: string;
}

// What a lesson offers, as small icons with words for screen readers
export const MediaIcons: React.FC<MediaIconsProps> = ({ youtubeUrl, audioUrl, transcript, className = '' }) => {
  const items = [
    youtubeUrl ? { key: 'video', label: 'مرئي', Icon: Video } : null,
    audioUrl ? { key: 'audio', label: 'صوتي', Icon: Headphones } : null,
    transcript?.trim() ? { key: 'text', label: 'مكتوب', Icon: FileText } : null,
  ].filter((item): item is { key: string; label: string; Icon: typeof Video } => Boolean(item));

  if (items.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {items.map(({ key, label, Icon }) => (
        <span
          key={key}
          title={label}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-sm font-semibold"
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{label}</span>
        </span>
      ))}
    </span>
  );
};
