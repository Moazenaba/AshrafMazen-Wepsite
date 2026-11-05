// Today in the Hijri and Gregorian calendars, as the site's date line.
export function todayLine(today: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long' }).format(today);
  const gregorian = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  return `${weekday}، ${hijri} - ${gregorian}`;
}
