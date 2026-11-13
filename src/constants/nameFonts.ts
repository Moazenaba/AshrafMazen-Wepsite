// The fonts the admin can choose for the sheikh's name (the top bar and the big name on the home page).
// Every font is kept on the site itself (public/fonts, declared in index.html): the site's security policy only
// loads fonts from the site. To offer another font: add its .woff2 files and @font-face lines, then one entry here.
// The eight after the first four are SIL Open Font License fonts from the npm packages @fontsource/* (bold weight only,
// the name is always bold); a font file is fetched by a visitor's browser only when that font is the chosen one.

import { DEFAULT_NAME_FONT_ID, NAME_FONT_LIST } from './nameFontList.js';

export interface NameFont {
  id: string;
  label: string;
  // The font-family value, with a fallback
  family: string;
  // Its Arabic-letters file in public/fonts, preloaded by the pages when it is the chosen font
  file: string;
}

export const DEFAULT_NAME_FONT = DEFAULT_NAME_FONT_ID;

// The list itself is plain data in nameFontList.js, so the build can read it too
export const NAME_FONTS: NameFont[] = NAME_FONT_LIST;

// The font for a saved id; an unknown or empty id gives the default
export function nameFontOf(id: string | null | undefined): NameFont {
  return NAME_FONTS.find((f) => f.id === id) ?? NAME_FONTS[0];
}
