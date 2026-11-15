// Site settings and branding (name, logo, about text).
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { uploadToR2 } from '../r2';
import { deleteIfUnused } from './fileUsage';
import type { SiteSettings } from '../../types';
import { DEFAULT_NAME_FONT } from '../../constants/nameFonts';
import { loadSiteBundle } from './siteBundle';
import { bundleSettings } from './siteBundleRules';

let cachedSiteSettings: SiteSettings | null = null;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  banner_name: 'أبو عبد الرحمن أشرف بن طه بن مازن',
  banner_logo_url: '',
  banner_font: DEFAULT_NAME_FONT,
  about_sheikh:
    'الشيخ أشرف مازن، من علماء وأساتذة العلوم الشرعية المعاصرين. يُعنى بنشر العلم الشرعي المؤصل، وشرح المتون العلمية في الفقه، والعقيدة، والحديث، والأصول وعلوم التزكية وفق منهج أهل السنة والجماعة.',
};

export async function getSiteSettings(forceRefresh = false): Promise<SiteSettings> {
  if (cachedSiteSettings && !forceRefresh) {
    return cachedSiteSettings;
  }
  if (!forceRefresh) {
    const bundle = await loadSiteBundle();
    if (bundle) return (cachedSiteSettings = bundleSettings(bundle));
  }
  try {
    // Only the three values the header and footer show (the table also holds the library and other large records)
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['banner_name', 'banner_logo_url', 'about_sheikh', 'banner_font']);
    if (!error && data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((row) => {
        if (row.key) settingsMap[row.key] = row.value || '';
      });

      cachedSiteSettings = {
        banner_name: settingsMap.banner_name || DEFAULT_SITE_SETTINGS.banner_name,
        banner_logo_url: settingsMap.banner_logo_url || '',
        about_sheikh: settingsMap.about_sheikh || DEFAULT_SITE_SETTINGS.about_sheikh,
        banner_font: settingsMap.banner_font || DEFAULT_NAME_FONT,
      };
      return cachedSiteSettings;
    }
  } catch (err) {
    console.warn('Failed to load site_settings, using fallback:', err);
  }

  cachedSiteSettings = { ...DEFAULT_SITE_SETTINGS };
  return cachedSiteSettings;
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const entries = Object.entries(settings).filter(([_, val]) => val !== undefined);
  if (entries.length === 0) return;

  const previousLogo = (await getSiteSettings(true)).banner_logo_url;
  const rows = entries.map(([key, value]) => ({
    key,
    value: value || '',
  }));

  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    throw new Error(translateSupabaseError(error));
  }

  // Refresh cache
  cachedSiteSettings = null;
  await getSiteSettings(true);
  // The logo was replaced or removed: the old file on R2 is no longer used
  if (settings.banner_logo_url !== undefined && previousLogo && previousLogo !== settings.banner_logo_url) {
    await deleteIfUnused(previousLogo);
  }
}

export async function uploadBrandingLogo(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف شعار.');

  // Validate format
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowed = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
  if (!allowed.includes(extension)) {
    throw new Error('صيغة الملف غير مدعومة. يرجى اختيار ملف صورة بصيغة (PNG, JPG, SVG, WebP).');
  }

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 2 ميجابايت.');
  }

  return uploadToR2(file, 'logo');
}
