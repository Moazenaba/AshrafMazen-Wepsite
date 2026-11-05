import { formatAudioTime } from './helpers';

export interface LessonChapter {
  seconds: number;
  title: string;
}

const LINE_PATTERN = /^(?:(\d+):)?(\d{1,2}):(\d{2})\s*[-–:]?\s*(.+)$/;

// Arabic-Indic digits typed on an Arabic keyboard count too
function toWesternDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/**
 * Reads chapters written one per line as "mm:ss عنوان" or "h:mm:ss عنوان".
 * Lines that do not match are skipped; the result is sorted by time.
 */
export function parseChaptersText(text: string): LessonChapter[] {
  return toWesternDigits(text || '')
    .split('\n')
    .map((line) => line.trim().match(LINE_PATTERN))
    .filter((match): match is RegExpMatchArray => match !== null && Boolean(match[4]?.trim()))
    .map((match) => {
      const hours = Number(match[1] || 0);
      const minutes = Number(match[2]);
      const seconds = Number(match[3]);
      return { seconds: hours * 3600 + minutes * 60 + seconds, title: match[4].trim() };
    })
    .sort((a, b) => a.seconds - b.seconds);
}

export function formatChaptersText(chapters: LessonChapter[] | null | undefined): string {
  return (chapters || []).map((c) => `${formatAudioTime(c.seconds)} ${c.title}`).join('\n');
}

/**
 * The chapter being played at a given second, or -1 before the first one.
 */
export function activeChapterIndex(chapters: LessonChapter[], seconds: number): number {
  let active = -1;
  chapters.forEach((c, i) => {
    if (seconds >= c.seconds) active = i;
  });
  return active;
}
