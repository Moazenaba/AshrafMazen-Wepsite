// Admin: create, update and delete categories and series.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { Category, Series } from '../../types';
import { slugify } from './shared';

const SLUG_TAKEN = 'هذا الاسم المختصر (slug) مستخدم من قبل. اختر اسماً آخر.';

// Throws when another row of the table already has this slug (`exceptId` = the row being edited)
async function assertSlugFree(table: 'categories' | 'series', slug: string, exceptId?: string): Promise<void> {
  const { data, error } = await supabase.from(table).select('id').eq('slug', slug);
  if (error) throw new Error(translateSupabaseError(error));
  if ((data ?? []).some((row) => row.id !== exceptId)) throw new Error(SLUG_TAKEN);
}

// Categories CRUD
export async function createCategory(categoryData: Partial<Category>): Promise<Category> {
  const name = (categoryData.name || '').trim();
  if (!name) throw new Error('يرجى كتابة اسم القسم.');

  let finalSlug = slugify(categoryData.slug ? categoryData.slug : name);
  if (!finalSlug) finalSlug = `cat-${Date.now().toString(36)}`;
  await assertSlugFree('categories', finalSlug);

  const payload = {
    name,
    slug: finalSlug,
    description: (categoryData.description || '').trim(),
    sort_order: Number(categoryData.sort_order) || 1,
    color: categoryData.color || 'emerald',
    icon: categoryData.icon || 'BookOpen',
  };

  const { data, error } = await supabase
    .from('categories')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function updateCategory(
  id: string,
  categoryData: Partial<Category>
): Promise<Category> {
  const payload: any = { ...categoryData };
  if (categoryData.slug) {
    payload.slug = slugify(categoryData.slug);
    await assertSlugFree('categories', payload.slug, id);
  }

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Check if category has series before deletion
  const { data: existingSeries, error: countErr } = await supabase
    .from('series')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (countErr) {
    console.error('Error checking series for category:', countErr);
    throw new Error('تعذّر التأكد من أن القسم فارغ، فلم يُحذف. حاول مرة أخرى.');
  }

  if (existingSeries && existingSeries.length > 0) {
    throw new Error('لا يمكن حذف هذا القسم لأنه يحتوي على سلاسل علمية مرتبطة به. يرجى حذف أو نقل السلاسل أولاً.');
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  return true;
}

// Series CRUD
export async function createSeries(seriesData: Partial<Series>): Promise<Series> {
  const title = (seriesData.title || '').trim();
  if (!title) throw new Error('يرجى إدخال عنوان السلسلة العلمية.');
  if (!seriesData.category_id) throw new Error('يرجى اختيار القسم التابع له السلسلة.');

  let finalSlug = slugify(seriesData.slug ? seriesData.slug : title);
  if (!finalSlug) finalSlug = `series-${Date.now().toString(36)}`;
  await assertSlugFree('series', finalSlug);

  const payload = {
    category_id: seriesData.category_id,
    title,
    slug: finalSlug,
    description: (seriesData.description || '').trim(),
    sort_order: Number(seriesData.sort_order) || 1,
  };

  const { data, error } = await supabase
    .from('series')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function updateSeries(
  id: string,
  seriesData: Partial<Series>
): Promise<Series> {
  const payload: any = { ...seriesData };
  if (seriesData.slug) {
    payload.slug = slugify(seriesData.slug);
    await assertSlugFree('series', payload.slug, id);
  }

  const { data, error } = await supabase
    .from('series')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  return data;
}

export async function deleteSeries(id: string): Promise<boolean> {
  const { data: existingLessons, error: countErr } = await supabase.from('lessons').select('id').eq('series_id', id).limit(1);
  if (countErr) {
    console.error('Error checking lessons for series:', countErr);
    throw new Error('تعذّر التأكد من أن السلسلة فارغة، فلم تُحذف. حاول مرة أخرى.');
  }
  if (existingLessons && existingLessons.length > 0) {
    throw new Error('لا يمكن حذف هذه السلسلة لأنها تحتوي على دروس. احذف الدروس أو انقلها إلى سلسلة أخرى أولاً.');
  }

  const { error } = await supabase.from('series').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  return true;
}
