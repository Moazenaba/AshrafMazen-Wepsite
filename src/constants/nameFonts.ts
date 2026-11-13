// The fonts the admin can choose for the sheikh's name (the top bar and the big name on the home page).
// Every font is kept on the site itself (public/fonts, declared in index.html): the site's security policy only
// loads fonts from the site. To offer another font: add its .woff2 files and @font-face lines, then one entry here.
// The eight after the first four are SIL Open Font License fonts from the npm packages @fontsource/* (bold weight only,
// the name is always bold); a font file is fetched by a visitor's browser only when that font is the chosen one.

export interface NameFont {
  id: string;
  label: string;
  // The font-family value, with a fallback
  family: string;
}

export const DEFAULT_NAME_FONT = 'ruqaa';

export const NAME_FONTS: NameFont[] = [
  { id: 'ruqaa', label: 'الرقعة (الحالي)', family: "'Aref Ruqaa', 'Amiri', serif" },
  { id: 'amiri', label: 'أميري (نسخ)', family: "'Amiri', serif" },
  { id: 'cairo', label: 'القاهرة', family: "'Cairo', system-ui, sans-serif" },
  { id: 'plex', label: 'آي بي إم بلكس العربي', family: "'IBM Plex Sans Arabic', system-ui, sans-serif" },
  { id: 'reem-kufi', label: 'ريم كوفي', family: "'Reem Kufi', 'Amiri', serif" },
  { id: 'el-messiri', label: 'المسيري', family: "'El Messiri', 'Amiri', serif" },
  { id: 'lateef', label: 'لطيف', family: "'Lateef', 'Amiri', serif" },
  { id: 'scheherazade', label: 'شهرزاد الجديد', family: "'Scheherazade New', 'Amiri', serif" },
  { id: 'noto-naskh', label: 'نوتو نسخ', family: "'Noto Naskh Arabic', 'Amiri', serif" },
  { id: 'noto-kufi', label: 'نوتو كوفي', family: "'Noto Kufi Arabic', 'Amiri', serif" },
  { id: 'tajawal', label: 'تجوال', family: "'Tajawal', 'Amiri', serif" },
  { id: 'markazi', label: 'مركزي', family: "'Markazi Text', 'Amiri', serif" },
];

// The font for a saved id; an unknown or empty id gives the default
export function nameFontOf(id: string | null | undefined): NameFont {
  return NAME_FONTS.find((f) => f.id === id) ?? NAME_FONTS[0];
}
