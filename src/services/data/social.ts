// Social links shown in the footer.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { SocialLink } from '../../types';

let cachedActiveSocialLinks: SocialLink[] | null = null;

export async function getActiveSocialLinks(forceRefresh = false): Promise<SocialLink[]> {
  if (cachedActiveSocialLinks && !forceRefresh) {
    return cachedActiveSocialLinks;
  }

  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      cachedActiveSocialLinks = data;
      return data;
    }
  } catch (err) {
    console.warn('getActiveSocialLinks fallback:', err);
  }

  cachedActiveSocialLinks = [];
  return [];
}

export async function getAllSocialLinksAdmin(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(translateSupabaseError(error));
  }

  return data || [];
}

export async function createSocialLink(link: Omit<SocialLink, 'id'>): Promise<SocialLink> {
  const platform = (link.platform || '').trim();
  const url = (link.url || '').trim();
  if (!platform) throw new Error('يرجى اختيار المنصة.');
  if (!url) throw new Error('يرجى إدخال الرابط.');

  const payload = {
    platform,
    url,
    sort_order: Number(link.sort_order) || 0,
    is_active: link.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('social_links')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  cachedActiveSocialLinks = null;
  return data;
}

export async function updateSocialLink(
  id: string,
  updates: Partial<SocialLink>
): Promise<SocialLink> {
  const payload: any = { ...updates };
  if (payload.platform) payload.platform = payload.platform.trim();
  if (payload.url) payload.url = payload.url.trim();

  const { data, error } = await supabase
    .from('social_links')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  cachedActiveSocialLinks = null;
  return data;
}

export async function deleteSocialLink(id: string): Promise<boolean> {
  const { error } = await supabase.from('social_links').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  cachedActiveSocialLinks = null;
  return true;
}
