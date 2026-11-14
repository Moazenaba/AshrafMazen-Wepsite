// Admin: create, update and delete lessons (and their recordings on R2).
import type { LessonWithRelations } from './shared';
import { attachRelations } from './relations';
import { rowsOrThrow } from './db';
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { deleteFromR2, isR2Url } from '../r2';
import type { Lesson } from '../../types';
import { lessonRow, readLessonExtras, saveLessonExtras, withExtras } from './extras';

// Lessons CRUD
export async function createLesson(lessonData: Partial<Lesson>): Promise<Lesson> {
  const title = (lessonData.title || '').trim();
  if (!title) throw new Error('يرجى إدخال عنوان الدرس.');
  if (!lessonData.series_id) throw new Error('يرجى اختيار السلسلة العلمية.');

  const isPublished = lessonData.status === 'published';
  let published_at = lessonData.published_at;
  if (isPublished && !published_at) {
    published_at = new Date().toISOString();
  }

  const payload = {
    series_id: lessonData.series_id,
    title,
    lesson_number: Number(lessonData.lesson_number) || 1,
    youtube_url: (lessonData.youtube_url || '').trim(),
    audio_url: (lessonData.audio_url || '').trim(),
    transcript: (lessonData.transcript || '').trim(),
    status: lessonData.status || 'published',
    published_at,
  };

  const { data, error } = await supabase
    .from('lessons')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  await saveLessonExtras(data.id, { featured: Boolean(lessonData.featured), chapters: lessonData.chapters || [], image: lessonData.image || '' });
  return data;
}

export async function updateLesson(
  id: string,
  lessonData: Partial<Lesson>
): Promise<Lesson> {
  const payload: any = lessonRow(lessonData);
  const { data: before } = await supabase.from('lessons').select('audio_url').eq('id', id).maybeSingle();
  // A lesson keeps the date it was first published; only one published for the first time gets today's date
  if (payload.status === 'published' && !payload.published_at) {
    const { data: current, error: readErr } = await supabase.from('lessons').select('published_at').eq('id', id).maybeSingle();
    if (readErr) throw new Error(translateSupabaseError(readErr));
    if (!current?.published_at) payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('lessons')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(translateSupabaseError(error));
  await saveLessonExtras(id, lessonData);
  // The recording was replaced or removed: the old file on R2 is no longer used by anything
  const oldAudio = before?.audio_url as string | undefined;
  if (lessonData.audio_url !== undefined && oldAudio !== lessonData.audio_url) await dropLessonAudio(oldAudio);
  return data;
}

// Removes a lesson's recording from R2 unless another lesson still plays the same file
async function dropLessonAudio(url: string | null | undefined): Promise<void> {
  if (!url || !isR2Url(url)) return;
  const { data, error } = await supabase.from('lessons').select('id').eq('audio_url', url).limit(1);
  if (error || (data && data.length > 0)) return;
  await deleteFromR2(url);
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { data: before } = await supabase.from('lessons').select('audio_url').eq('id', id).maybeSingle();
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
  // Its recording goes with it (a failure here is logged, never blocks the delete)
  await dropLessonAudio(before?.audio_url as string | undefined);
  try {
    await saveLessonExtras(id, { featured: false, chapters: [], image: '' });
  } catch (err) {
    console.error('Lesson extras were not cleared:', err);
  }
  return true;
}

// Every lesson, drafts included, with its series, category, featured flag and chapters
export async function getAllLessonsAdmin(): Promise<LessonWithRelations[]> {
  const lessons = rowsOrThrow<Lesson>(await supabase.from('lessons').select('*').order('lesson_number', { ascending: true }));
  const extras = await readLessonExtras();
  return (await attachRelations(lessons)).map((l) => withExtras(l, extras));
}
