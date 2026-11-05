import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTACT,
  DEFAULT_HERO,
  cleanQuotes,
  isEmail,
  moveItem,
  parseContact,
  parseHero,
  parseQuotes,
  phoneLink,
  renumber,
} from './siteContentRules';

describe('parseQuotes', () => {
  it('uses the built-in sayings when nothing is saved or the record is broken', () => {
    expect(parseQuotes(null).length).toBeGreaterThan(0);
    expect(parseQuotes('not json').length).toBeGreaterThan(0);
  });

  it('respects a saved empty list (the admin removed every saying)', () => {
    expect(parseQuotes('[]')).toEqual([]);
  });

  it('drops sayings without text and trims the rest', () => {
    const raw = JSON.stringify([{ text: '  حديث   أول ', source: ' البخاري ' }, { text: '   ', source: 'x' }, { source: 'y' }]);
    expect(parseQuotes(raw)).toEqual([{ text: 'حديث أول', source: 'البخاري' }]);
  });
});

describe('cleanQuotes', () => {
  it('accepts only a list', () => {
    expect(cleanQuotes('x')).toEqual([]);
    expect(cleanQuotes(null)).toEqual([]);
  });

  it('caps the number of sayings', () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ text: `قول ${i}`, source: '' }));
    expect(cleanQuotes(many)).toHaveLength(100);
  });
});

describe('parseHero', () => {
  it('falls back to the default hadith when the text is missing', () => {
    expect(parseHero(null)).toEqual(DEFAULT_HERO);
    expect(parseHero(JSON.stringify({ text: '  ' }))).toEqual(DEFAULT_HERO);
  });

  it('reads a saved hadith', () => {
    expect(parseHero(JSON.stringify({ intro: 'قال ﷺ:', text: 'نص', source: 'مسلم' }))).toEqual({ intro: 'قال ﷺ:', text: 'نص', source: 'مسلم' });
  });
});

describe('parseContact', () => {
  it('starts with no email or phone, so nothing made up is shown', () => {
    expect(parseContact(null)).toEqual(DEFAULT_CONTACT);
    expect(DEFAULT_CONTACT.email).toBe('');
  });

  it('keeps saved values trimmed', () => {
    expect(parseContact(JSON.stringify({ email: ' a@b.com ', phone: '+20 100 000 0000', copyright: '', dua: 'دعاء' }))).toEqual({
      email: 'a@b.com',
      phone: '+20 100 000 0000',
      copyright: '',
      dua: 'دعاء',
    });
  });
});

describe('isEmail and phoneLink', () => {
  it('checks the shape of an address', () => {
    expect(isEmail('a@b.com')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.com')).toBe(false);
  });

  it('keeps only digits and a leading plus for tel: links', () => {
    expect(phoneLink('+20 (100) 000-0000')).toBe('+201000000000');
  });
});

describe('moveItem', () => {
  it('moves up and down, and ignores moves past the ends', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});

describe('renumber', () => {
  it('returns only the items whose place number changed', () => {
    const list = [
      { id: 'a', sort_order: 1 },
      { id: 'b', sort_order: 2 },
      { id: 'c', sort_order: 3 },
    ];
    expect(renumber(list)).toEqual([]);
    expect(renumber([list[1], list[0], list[2]])).toEqual([
      { id: 'b', sort_order: 1 },
      { id: 'a', sort_order: 2 },
    ]);
  });

  it('repairs equal or gapped numbers', () => {
    expect(renumber([{ id: 'a', sort_order: 0 }, { id: 'b', sort_order: 0 }, { id: 'c', sort_order: 9 }])).toEqual([
      { id: 'a', sort_order: 1 },
      { id: 'b', sort_order: 2 },
      { id: 'c', sort_order: 3 },
    ]);
  });
});
