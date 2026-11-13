// The fonts the admin can choose for the sheikh's name, as plain data: the site (nameFonts.ts) and the build
// (scripts/prerender.mjs, which writes the chosen one into every page and preloads its file) both read this list.
// `file` is the Arabic-letters file of the bold weight in public/fonts (the name is always bold).

/** @type {{ id: string; label: string; family: string; file: string }[]} */
export const NAME_FONT_LIST = [
  { id: 'ruqaa', label: 'الرقعة (الحالي)', family: "'Aref Ruqaa', 'Amiri', serif", file: '/fonts/aref-ruqaa-arabic-700-normal.woff2' },
  { id: 'amiri', label: 'أميري (نسخ)', family: "'Amiri', serif", file: '/fonts/amiri-arabic-700-normal.woff2' },
  { id: 'cairo', label: 'القاهرة', family: "'Cairo', system-ui, sans-serif", file: '/fonts/cairo-arabic-700-normal.woff2' },
  { id: 'plex', label: 'آي بي إم بلكس العربي', family: "'IBM Plex Sans Arabic', system-ui, sans-serif", file: '/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2' },
  { id: 'reem-kufi', label: 'ريم كوفي', family: "'Reem Kufi', 'Amiri', serif", file: '/fonts/reem-kufi-arabic-700-normal.woff2' },
  { id: 'el-messiri', label: 'المسيري', family: "'El Messiri', 'Amiri', serif", file: '/fonts/el-messiri-arabic-700-normal.woff2' },
  { id: 'lateef', label: 'لطيف', family: "'Lateef', 'Amiri', serif", file: '/fonts/lateef-arabic-700-normal.woff2' },
  { id: 'scheherazade', label: 'شهرزاد الجديد', family: "'Scheherazade New', 'Amiri', serif", file: '/fonts/scheherazade-new-arabic-700-normal.woff2' },
  { id: 'noto-naskh', label: 'نوتو نسخ', family: "'Noto Naskh Arabic', 'Amiri', serif", file: '/fonts/noto-naskh-arabic-arabic-700-normal.woff2' },
  { id: 'noto-kufi', label: 'نوتو كوفي', family: "'Noto Kufi Arabic', 'Amiri', serif", file: '/fonts/noto-kufi-arabic-arabic-700-normal.woff2' },
  { id: 'tajawal', label: 'تجوال', family: "'Tajawal', 'Amiri', serif", file: '/fonts/tajawal-arabic-700-normal.woff2' },
  { id: 'markazi', label: 'مركزي', family: "'Markazi Text', 'Amiri', serif", file: '/fonts/markazi-text-arabic-700-normal.woff2' },
];

export const DEFAULT_NAME_FONT_ID = 'ruqaa';
