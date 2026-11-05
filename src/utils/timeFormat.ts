// Dates and playback times in Arabic.
/**
 * A date in Arabic: "٣ نوفمبر ٢٠٢٦"
 */
export function formatArabicDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Seconds as a clock: "05:30" or "1:05:30"
 */
export function formatAudioTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
