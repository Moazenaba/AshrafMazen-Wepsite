// The lesson form's behaviour: values, reset when it opens, recording upload, validation and saving.
import { useEffect, useState } from 'react';
import { uploadAudioFile } from '../../../../services/dataService';
import type { Lesson, Series } from '../../../../types';
import {
  formFromLesson,
  newLessonForm,
  toSaveData,
  validateLessonForm,
  type LessonFormState,
  type LessonRef,
  type LessonSaveData,
} from './lessonForm';

interface Options {
  isOpen: boolean;
  initialData?: Lesson | null;
  prefill: Partial<Lesson> | null;
  seriesList: Series[];
  lessons: LessonRef[];
  onSave: (data: LessonSaveData) => Promise<void>;
  onClose: () => void;
}

export function useLessonForm({ isOpen, initialData, prefill, seriesList, lessons, onSave, onClose }: Options) {
  const [form, setForm] = useState<LessonFormState>(() => newLessonForm(null, seriesList[0]?.id || '', lessons));
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Every time the window opens (or its lesson changes) the form starts from that lesson, or from a new one
  useEffect(() => {
    setForm(initialData ? formFromLesson(initialData) : newLessonForm(prefill, seriesList[0]?.id || '', lessons));
    setError('');
    // `lessons` is deliberately left out: a refreshed list must not wipe what is being typed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen, seriesList, prefill]);

  const update = (patch: Partial<LessonFormState>) => setForm((current) => ({ ...current, ...patch }));

  const uploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      setUploadingAudio(true);
      update({ audioUrl: await uploadAudioFile(file) });
    } catch (err: any) {
      setError(err.message || 'فشل رفع الملف الصوتي');
    } finally {
      setUploadingAudio(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateLessonForm(form, lessons, initialData?.id);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      setLoading(true);
      await onSave(toSaveData(form));
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setLoading(false);
    }
  };

  return { form, update, error, loading, uploadingAudio, uploadAudio, submit };
}
