// Sharing the lesson's link and copying its transcript, each with a short "done" flag for the screen.
import { useState } from 'react';
import type { Lesson, Series } from '../../types';

export function useShare(lesson: Lesson | null, series: Series | null) {
  const [isCopied, setIsCopied] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);

  const copyTranscript = () => {
    if (!lesson?.transcript) return;
    navigator.clipboard.writeText(lesson.transcript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const share = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${lesson?.title} - الشيخ أشرف مازن`,
          text: `درس ${lesson?.title} من ${series?.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    }
  };

  return { isCopied, isShareCopied, copyTranscript, share };
}

export type Share = ReturnType<typeof useShare>;
