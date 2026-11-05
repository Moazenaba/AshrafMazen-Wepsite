// Arabic numbers: lesson ordinals, view and lesson counts, digits.
/**
 * Small formatting helpers shared by the public pages and the admin.
 */

/**
 * "الدرس الأول", "الدرس الثاني"... for a lesson number
 */
export function getArabicLessonOrdinal(num: number | null | undefined): string {
  if (!num || isNaN(num)) return 'الدرس';

  const ordinals: Record<number, string> = {
    1: 'الدرس الأول',
    2: 'الدرس الثاني',
    3: 'الدرس الثالث',
    4: 'الدرس الرابع',
    5: 'الدرس الخامس',
    6: 'الدرس السادس',
    7: 'الدرس السابع',
    8: 'الدرس الثامن',
    9: 'الدرس التاسع',
    10: 'الدرس العاشر',
    11: 'الدرس الحادي عشر',
    12: 'الدرس الثاني عشر',
    13: 'الدرس الثالث عشر',
    14: 'الدرس الرابع عشر',
    15: 'الدرس الخامس عشر',
    16: 'الدرس السادس عشر',
    17: 'الدرس السابع عشر',
    18: 'الدرس الثامن عشر',
    19: 'الدرس التاسع عشر',
    20: 'الدرس العشرون',
    21: 'الدرس الحادي والعشرون',
    22: 'الدرس الثاني والعشرون',
    23: 'الدرس الثالث والعشرون',
    24: 'الدرس الرابع والعشرون',
    25: 'الدرس الخامس والعشرون',
    26: 'الدرس السادس والعشرون',
    27: 'الدرس السابع والعشرون',
    28: 'الدرس الثامن والعشرون',
    29: 'الدرس التاسع والعشرون',
    30: 'الدرس الثلاثون',
    31: 'الدرس الحادي والثلاثون',
    32: 'الدرس الثاني والثلاثون',
    33: 'الدرس الثالث والثلاثون',
    34: 'الدرس الرابع والثلاثون',
    35: 'الدرس الخامس والثلاثون',
    36: 'الدرس السادس والثلاثون',
    37: 'الدرس السابع والثلاثون',
    38: 'الدرس الثامن والثلاثون',
    39: 'الدرس التاسع والثلاثون',
    40: 'الدرس الأربعون',
    50: 'الدرس الخمسون',
    60: 'الدرس الستون',
    70: 'الدرس السبعون',
    80: 'الدرس الثمانون',
    90: 'الدرس التسعون',
    100: 'الدرس المائة',
  };

  return ordinals[num] ? ordinals[num] : `الدرس رقم ${num}`;
}

/**
 * A number in Arabic-Indic digits: "١٢٣٤"
 */
export function formatArabicViews(views: number | null | undefined): string {
  const safe = typeof views === 'number' && !isNaN(views) ? views : 0;
  return new Intl.NumberFormat('ar-EG').format(safe);
}

/**
 * The grammatical forms of the words that are counted
 */
export const COUNT_FORMS = {
  lesson: { one: 'درس واحد', two: 'درسان', few: 'دروس', many: 'درسًا' },
  series: { one: 'سلسلة واحدة', two: 'سلسلتان', few: 'سلاسل', many: 'سلسلة' },
  view: { one: 'مشاهدة واحدة', two: 'مشاهدتان', few: 'مشاهدات', many: 'مشاهدة' },
};

/**
 * A counted noun with Arabic number agreement: "درس واحد" / "درسان" / "٥ دروس" / "١١ درسًا"
 */
export function formatArabicCount(
  count: number,
  forms: { one: string; two: string; few: string; many: string }
): string {
  const n = Math.max(0, Math.floor(count || 0));
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const formatted = new Intl.NumberFormat('ar-EG').format(n);
  const lastTwo = n % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return `${formatted} ${forms.few}`;
  if (lastTwo >= 11 && lastTwo <= 99) return `${formatted} ${forms.many}`;
  return `${formatted} ${forms.one.split(' ')[0]}`;
}

// A number in Arabic-Indic digits
export const arabicNumber = (n: number): string => new Intl.NumberFormat('ar-EG').format(n);
