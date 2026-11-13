// The fonts the admin can choose for the sheikh's name (the top bar and the big name on the home page).
// Every font is kept on the site itself (public/fonts, declared in index.html): the site's security policy only
// loads fonts from the site. To offer another font: add its .woff2 files and @font-face lines, then one entry here.

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
];

// The font for a saved id; an unknown or empty id gives the default
export function nameFontOf(id: string | null | undefined): NameFont {
  return NAME_FONTS.find((f) => f.id === id) ?? NAME_FONTS[0];
}
