// How the statistics screen writes numbers and durations in Arabic.
export const nf = new Intl.NumberFormat('ar-EG');
export const n = (value: number) => nf.format(Math.round(value));

// Seconds as hours and minutes, in words: "٣ ساعات و١٥ دقيقة", "٤٥ دقيقة", "أقل من دقيقة"
export function duration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return seconds > 0 ? 'أقل من دقيقة' : '٠';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${n(m)} دقيقة`;
  const hours = h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : h <= 10 ? `${n(h)} ساعات` : `${n(h)} ساعة`;
  return m ? `${hours} و${n(m)} دقيقة` : hours;
}

export const hoursOnly = (seconds: number) => nf.format(Math.round((seconds / 3600) * 10) / 10);
