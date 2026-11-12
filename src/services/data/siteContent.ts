// The texts the admin edits from the dashboard (sayings strip, home hadith, contact details), kept in site_settings.
// Visitors read them like any other public setting; only admins can write them (see docs/migrations/2026-11-05-security.sql).
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import {
  DEFAULT_CONTENT,
  SITE_CONTENT_KEYS,
  cleanContact,
  cleanQuotes,
  parseContact,
  parseHero,
  parseQuotes,
  type ContactInfo,
  type HeroQuote,
  type SiteContent,
} from './siteContentRules';
import type { TickerQuote } from '../../constants/tickerQuotes';
import { cleanHomeFeature, parseHomeFeature, validateHomeFeature, type HomeFeature } from './homeFeatureRules';
import { cleanWelcomeSound, parseWelcomeSound, validateWelcomeSound, type WelcomeSound } from './welcomeSoundRules';

let cached: SiteContent | null = null;

export async function getSiteContent(forceRefresh = false): Promise<SiteContent> {
  if (cached && !forceRefresh) return cached;
  try {
    const keys = Object.values(SITE_CONTENT_KEYS);
    const { data, error } = await supabase.from('site_settings').select('key, value').in('key', keys);
    if (!error && data) {
      const byKey = new Map(data.map((row) => [row.key as string, (row.value ?? null) as string | null]));
      cached = {
        quotes: parseQuotes(byKey.get(SITE_CONTENT_KEYS.quotes)),
        hero: parseHero(byKey.get(SITE_CONTENT_KEYS.hero)),
        contact: parseContact(byKey.get(SITE_CONTENT_KEYS.contact)),
        feature: parseHomeFeature(byKey.get(SITE_CONTENT_KEYS.feature)),
        welcome: parseWelcomeSound(byKey.get(SITE_CONTENT_KEYS.welcome)),
      };
      return cached;
    }
  } catch (err) {
    console.warn('Failed to load the site texts, using the built-in ones:', err);
  }
  return DEFAULT_CONTENT;
}

async function write(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.from('site_settings').upsert([{ key, value: JSON.stringify(value) }], { onConflict: 'key' });
  if (error) throw new Error(translateSupabaseError(error));
  cached = null;
}

export async function saveQuotes(quotes: TickerQuote[]): Promise<TickerQuote[]> {
  const clean = cleanQuotes(quotes);
  await write(SITE_CONTENT_KEYS.quotes, clean);
  return clean;
}

export async function saveHeroQuote(hero: HeroQuote): Promise<void> {
  if (!hero.text.trim()) throw new Error('اكتب نص الحديث الذي يظهر في الصفحة الرئيسية.');
  await write(SITE_CONTENT_KEYS.hero, hero);
}

export async function saveContactInfo(contact: ContactInfo): Promise<ContactInfo> {
  const clean = cleanContact(contact);
  await write(SITE_CONTENT_KEYS.contact, clean);
  return clean;
}

export async function saveHomeFeature(feature: HomeFeature): Promise<HomeFeature> {
  const clean = cleanHomeFeature(feature);
  const problem = validateHomeFeature(clean);
  if (problem) throw new Error(problem);
  await write(SITE_CONTENT_KEYS.feature, clean);
  return clean;
}

export async function saveWelcomeSound(sound: WelcomeSound): Promise<WelcomeSound> {
  const clean = cleanWelcomeSound(sound);
  const problem = validateWelcomeSound(clean);
  if (problem) throw new Error(problem);
  await write(SITE_CONTENT_KEYS.welcome, clean);
  return clean;
}
