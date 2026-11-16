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
import { cleanSideMenu, parseSideMenu, type SideMenuConfig } from './sideMenuRules';
import { loadSiteBundle } from './siteBundle';
import { deleteIfUnused } from './fileUsage';
import { bundleContent } from './siteBundleRules';
import { cleanHomeFeature, parseHomeFeature, validateHomeFeature, type HomeFeature } from './homeFeatureRules';
import { cleanLiveStream, parseLiveStream, validateLiveStream, type LiveStream } from './liveStreamRules';
import { cleanWelcomeSound, parseWelcomeSound, validateWelcomeSound, type WelcomeSound } from './welcomeSoundRules';

let cached: SiteContent | null = null;

export async function getSiteContent(forceRefresh = false): Promise<SiteContent> {
  if (cached && !forceRefresh) return cached;
  if (!forceRefresh) {
    const bundle = await loadSiteBundle();
    if (bundle) return (cached = bundleContent(bundle));
  }
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
        menu: parseSideMenu(byKey.get(SITE_CONTENT_KEYS.menu)),
        welcome: parseWelcomeSound(byKey.get(SITE_CONTENT_KEYS.welcome)),
        live: parseLiveStream(byKey.get(SITE_CONTENT_KEYS.live)),
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
  const before = (await getSiteContent(true)).feature;
  await write(SITE_CONTENT_KEYS.feature, clean);
  if (before.imageUrl && before.imageUrl !== clean.imageUrl) await deleteIfUnused(before.imageUrl);
  if (before.audioUrl && before.audioUrl !== clean.audioUrl) await deleteIfUnused(before.audioUrl);
  return clean;
}

export async function saveSideMenu(menu: SideMenuConfig): Promise<SideMenuConfig> {
  const clean = cleanSideMenu(menu);
  await write(SITE_CONTENT_KEYS.menu, clean);
  return clean;
}

export async function saveWelcomeSound(sound: WelcomeSound): Promise<WelcomeSound> {
  const clean = cleanWelcomeSound(sound);
  const problem = validateWelcomeSound(clean);
  if (problem) throw new Error(problem);
  const before = (await getSiteContent(true)).welcome;
  await write(SITE_CONTENT_KEYS.welcome, clean);
  if (before.url && before.url !== clean.url) await deleteIfUnused(before.url);
  return clean;
}

export async function saveLiveStream(live: LiveStream): Promise<LiveStream> {
  const clean = cleanLiveStream(live);
  const problem = validateLiveStream(clean);
  if (problem) throw new Error(problem);
  await write(SITE_CONTENT_KEYS.live, clean);
  return clean;
}

// The live broadcast straight from the database, not through the cached /api/site answer, so switching it on or off shows
// within seconds. One small row; the banner asks for it a moment after the page appears and then every minute or two.
export async function readLiveStream(): Promise<LiveStream> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', SITE_CONTENT_KEYS.live).maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  return parseLiveStream(data?.value ?? null);
}

// Removes the welcome sound altogether: the setting is cleared (so nothing plays), and the file is deleted from storage
// when it was uploaded to the site and no lesson uses the same file (a lesson's recording saved here by mistake stays).
export async function removeWelcomeSound(current: WelcomeSound): Promise<WelcomeSound> {
  const cleared = cleanWelcomeSound({ enabled: false, url: '', volume: current.volume });
  await write(SITE_CONTENT_KEYS.welcome, cleared);
  await deleteIfUnused(current.url);
  return cleared;
}
