// Pure rules for the texts the admin edits from the dashboard: the sayings strip, the home hadith, the contact details.
// Nothing here touches the database or the screen, so each rule can be tested on its own.
import { TICKER_QUOTES, type TickerQuote } from '../../constants/tickerQuotes';
import { EMPTY_FEATURE, type HomeFeature } from './homeFeatureRules';

export interface HeroQuote {
  intro: string;
  text: string;
  source: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  copyright: string;
  dua: string;
}

export interface SiteContent {
  quotes: TickerQuote[];
  hero: HeroQuote;
  contact: ContactInfo;
  feature: HomeFeature;
}

export const SITE_CONTENT_KEYS = { quotes: 'ticker_quotes', hero: 'hero_quote', contact: 'contact_info', feature: 'home_feature' } as const;

export const MAX_QUOTES = 100;
export const QUOTE_LIMITS = { text: 500, source: 150, intro: 80, email: 120, phone: 40, footer: 200 };

export const DEFAULT_HERO: HeroQuote = {
  intro: 'قال رسول الله ﷺ:',
  text: 'من يُرِد الله به خيرًا يُفقِّهه في الدين',
  source: 'متفق عليه',
};

export const DEFAULT_CONTACT: ContactInfo = {
  email: '',
  phone: '',
  copyright: 'جميع المواد العلمية متاحة للنشر في سبيل الله.',
  dua: 'نسأل الله الإخلاص والقبول في القول والعمل',
};

export const DEFAULT_CONTENT: SiteContent = { quotes: TICKER_QUOTES, hero: DEFAULT_HERO, contact: DEFAULT_CONTACT, feature: EMPTY_FEATURE };

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function readJson(raw: string | null | undefined): unknown {
  if (raw === null || raw === undefined || raw === '') return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Sayings with no text are dropped; the rest are trimmed and capped
export function cleanQuotes(list: unknown): TickerQuote[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((q) => ({ text: text(q?.text, QUOTE_LIMITS.text), source: text(q?.source, QUOTE_LIMITS.source) }))
    .filter((q) => q.text.length > 0)
    .slice(0, MAX_QUOTES);
}

// Nothing saved yet = the built-in sayings. A saved empty list is respected: the admin removed them all, so the strip is hidden.
export function parseQuotes(raw: string | null | undefined): TickerQuote[] {
  const data = readJson(raw);
  return Array.isArray(data) ? cleanQuotes(data) : DEFAULT_CONTENT.quotes;
}

export function parseHero(raw: string | null | undefined): HeroQuote {
  const data = readJson(raw) as Partial<HeroQuote> | undefined;
  if (!data || typeof data !== 'object') return DEFAULT_HERO;
  const quote = text(data.text, QUOTE_LIMITS.text);
  if (!quote) return DEFAULT_HERO;
  return { intro: text(data.intro, QUOTE_LIMITS.intro), text: quote, source: text(data.source, QUOTE_LIMITS.source) };
}

export function cleanContact(data: Partial<ContactInfo> | undefined): ContactInfo {
  return {
    email: text(data?.email, QUOTE_LIMITS.email),
    phone: text(data?.phone, QUOTE_LIMITS.phone),
    copyright: text(data?.copyright, QUOTE_LIMITS.footer),
    dua: text(data?.dua, QUOTE_LIMITS.footer),
  };
}

export function parseContact(raw: string | null | undefined): ContactInfo {
  const data = readJson(raw);
  if (!data || typeof data !== 'object') return DEFAULT_CONTACT;
  return cleanContact(data as Partial<ContactInfo>);
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// A phone number the visitor can tap: digits and a leading +, nothing else
export const phoneLink = (value: string) => value.replace(/[^\d+]/g, '');

// Moves one item a step up (-1) or down (+1); out of range changes nothing
export function moveItem<T>(list: T[], index: number, step: -1 | 1): T[] {
  const target = index + step;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = list.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// After a move, gives every item the number of its place (1, 2, 3...). Returns only the items whose number changed,
// so a list whose numbers were equal or had gaps is repaired in the same step.
export function renumber<T extends { id: string; sort_order: number }>(ordered: T[]): { id: string; sort_order: number }[] {
  return ordered.flatMap((item, i) => (item.sort_order === i + 1 ? [] : [{ id: item.id, sort_order: i + 1 }]));
}
