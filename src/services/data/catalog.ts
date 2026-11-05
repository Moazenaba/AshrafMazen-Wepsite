// Reading categories and series.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { Category, Series } from '../../types';

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(translateSupabaseError(error));
    }
    return data || [];
  } catch (err: any) {
    console.error('getCategories error:', err);
    throw err;
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getCategory error:', err);
    throw err;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getCategoryBySlug error:', err);
    throw err;
  }
}

export async function getAllSeries(): Promise<Series[]> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(translateSupabaseError(error));
    return data || [];
  } catch (err) {
    console.error('getAllSeries error:', err);
    throw err;
  }
}

export async function getSeriesByCategory(categoryId: string): Promise<Series[]> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(translateSupabaseError(error));
    return data || [];
  } catch (err) {
    console.error('getSeriesByCategory error:', err);
    throw err;
  }
}

export async function getSeries(seriesId: string): Promise<Series | null> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id', seriesId)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getSeries error:', err);
    throw err;
  }
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(translateSupabaseError(error));
    return data || null;
  } catch (err) {
    console.error('getSeriesBySlug error:', err);
    throw err;
  }
}
