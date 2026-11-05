// The audio library: every published lesson that has a recording.
import type { Lesson } from '../../types';
import { publishedLessons, rowsOrThrow } from './db';
import { attachRelations } from './relations';
import type { LessonWithRelations } from './shared';

export async function getAudioLessons(): Promise<LessonWithRelations[]> {
  const lessons = rowsOrThrow<Lesson>(
    await publishedLessons().neq('audio_url', '').not('audio_url', 'is', null).order('published_at', { ascending: false })
  );
  return attachRelations(lessons);
}
