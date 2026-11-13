import { describe, expect, it } from 'vitest';
import { DEFAULT_NAME_FONT, NAME_FONTS, nameFontOf } from './nameFonts';

describe('name fonts', () => {
  it('gives the chosen font, and the default for an unknown or empty one', () => {
    expect(nameFontOf('cairo').id).toBe('cairo');
    expect(nameFontOf('nope').id).toBe(DEFAULT_NAME_FONT);
    expect(nameFontOf(null).id).toBe(DEFAULT_NAME_FONT);
  });

  it('has unique ids, and the default is one of them', () => {
    const ids = NAME_FONTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_NAME_FONT);
  });
});
