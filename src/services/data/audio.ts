// Audio library: lessons with a recording, and uploading a recording to R2.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { uploadToR2 } from '../r2';
import { getAllSeries, getCategories } from './catalog';
import type { LessonWithRelations } from './shared';

export async function getAudioLessons(): Promise<LessonWithRelations[]> {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('status', 'published')
    .neq('audio_url', '')
    .not('audio_url', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(translateSupabaseError(error));
  if (!lessons || lessons.length === 0) return [];

  const [allSeries, allCategories] = await Promise.all([getAllSeries(), getCategories()]);
  const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
  const catMap = new Map(allCategories.map((c) => [c.id, c]));
  return lessons.map((l) => {
    const s = seriesMap.get(l.series_id) || null;
    return { ...l, series: s, category: s ? catMap.get(s.category_id) || null : null };
  });
}


export async function uploadAudioFile(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف صوتي.');

  // Validate file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ['mp3', 'm4a', 'wav', 'ogg'];
  if (!allowedExtensions.includes(extension)) {
    throw new Error('صيغة الملف غير مدعومة. يرجى اختيار ملف صوتي بصيغة (mp3, m4a, wav, ogg).');
  }

  return uploadToR2(file, 'audio');
}
