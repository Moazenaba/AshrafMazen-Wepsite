// The reader's chosen size for the transcript text, remembered in this browser.
import { useState } from 'react';

const FONT_SIZE_KEY = 'transcript_font_size';
const DEFAULT_FONT_SIZE = 20;
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 30;

function readStoredFontSize(): number {
  try {
    const stored = parseInt(localStorage.getItem(FONT_SIZE_KEY) || '', 10);
    if (stored >= MIN_FONT_SIZE && stored <= MAX_FONT_SIZE) return stored;
  } catch {
    // storage blocked: the default size is used
  }
  return DEFAULT_FONT_SIZE;
}

export function useTranscriptFont() {
  const [size, setSize] = useState<number>(readStoredFontSize);
  const change = (next: number) => {
    const clamped = Math.min(Math.max(next, MIN_FONT_SIZE), MAX_FONT_SIZE);
    setSize(clamped);
    try {
      localStorage.setItem(FONT_SIZE_KEY, String(clamped));
    } catch {
      // storage blocked: the size just is not remembered
    }
  };
  return { size, change };
}

export type TranscriptFont = ReturnType<typeof useTranscriptFont>;
