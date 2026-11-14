// The lesson form without any screen: its values, how they start, and the rules they must pass.
import { getYouTubeId } from '../../../../lib/youtube';
import type { Lesson, LessonChapter, LessonStatus } from '../../../../types';
import { formatChaptersText, parseChaptersText } from '../../../../utils/chapters';

export interface LessonFormState {
  seriesId: string;
  lessonNumber: number;
  title: string;
  youtubeUrl: string;
  audioInputType: 'url' | 'file';
  audioUrl: string;
  transcript: string;
  chaptersText: string;
  featured: boolean;
  status: LessonStatus;
  // The lesson's own picture (optional)
  imageUrl: string;
}

// What the form hands to the dashboard when it is saved
export interface LessonSaveData {
  series_id: string;
  lesson_number: number;
  title: string;
  youtube_url: string;
  audio_url: string;
  transcript: string;
  chapters: LessonChapter[];
  featured: boolean;
  status: LessonStatus;
  image: string;
}

export type LessonRef = Pick<Lesson, 'id' | 'series_id' | 'lesson_number'>;

// Props every field group receives: the values and a way to change some of them
export interface FormProps {
  form: LessonFormState;
  update: (patch: Partial<LessonFormState>) => void;
}

// The number after the last lesson of a series (1 for an empty series)
export const nextLessonNumber = (lessons: Pick<Lesson, 'series_id' | 'lesson_number'>[], seriesId: string): number =>
  lessons.filter((l) => l.series_id === seriesId).reduce((max, l) => Math.max(max, Number(l.lesson_number) || 0), 0) + 1;

export function formFromLesson(lesson: Lesson): LessonFormState {
  return {
    seriesId: lesson.series_id,
    lessonNumber: lesson.lesson_number,
    title: lesson.title,
    youtubeUrl: lesson.youtube_url || '',
    audioInputType: 'url',
    audioUrl: lesson.audio_url || '',
    transcript: lesson.transcript || '',
    chaptersText: formatChaptersText(lesson.chapters),
    featured: Boolean(lesson.featured),
    status: lesson.status,
    imageUrl: lesson.image || '',
  };
}

// A new lesson: numbered after the last of its series, optionally filled from a visitor's suggestion
export function newLessonForm(prefill: Partial<Lesson> | null, firstSeriesId: string, lessons: LessonRef[]): LessonFormState {
  const seriesId = prefill?.series_id || firstSeriesId;
  return {
    seriesId,
    lessonNumber: nextLessonNumber(lessons, seriesId),
    title: prefill?.title || '',
    youtubeUrl: prefill?.youtube_url || '',
    audioInputType: 'url',
    audioUrl: prefill?.audio_url || '',
    transcript: prefill?.transcript || '',
    chaptersText: '',
    featured: false,
    status: prefill?.status || 'published',
    imageUrl: '',
  };
}

// The first rule the form breaks, in words; null when it can be saved
export function validateLessonForm(form: LessonFormState, lessons: LessonRef[], editingId?: string): string | null {
  if (!form.title.trim()) return 'يرجى إدخال عنوان الدرس';
  if (!form.seriesId) return 'يرجى اختيار السلسلة العلمية';
  const number = Number(form.lessonNumber) || 1;
  const taken = lessons.some((l) => l.series_id === form.seriesId && Number(l.lesson_number) === number && l.id !== editingId);
  if (taken) return `رقم الدرس ${number} مستخدم في هذه السلسلة. الرقم التالي المتاح: ${nextLessonNumber(lessons, form.seriesId)}.`;
  if (form.youtubeUrl.trim() && !getYouTubeId(form.youtubeUrl)) {
    return 'رابط يوتيوب غير صحيح. الصق رابط الفيديو كما يظهر في يوتيوب (youtube.com/watch?v=... أو youtu.be/...).';
  }
  if (form.status === 'published' && !form.youtubeUrl.trim() && !form.audioUrl.trim() && !form.transcript.trim()) {
    return 'لا يمكن نشر درس بلا فيديو ولا صوت ولا تفريغ. أضف واحداً منها، أو احفظه مسودة.';
  }
  return null;
}

export function toSaveData(form: LessonFormState): LessonSaveData {
  return {
    series_id: form.seriesId,
    lesson_number: Number(form.lessonNumber) || 1,
    title: form.title.trim(),
    youtube_url: form.youtubeUrl.trim(),
    audio_url: form.audioUrl.trim(),
    transcript: form.transcript.trim(),
    chapters: parseChaptersText(form.chaptersText),
    featured: form.featured,
    status: form.status,
    image: form.imageUrl.trim(),
  };
}
