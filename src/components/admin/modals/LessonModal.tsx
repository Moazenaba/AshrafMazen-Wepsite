// The window to add or edit a lesson. The form's rules are in ./lesson/lessonForm.ts, its behaviour in useLessonForm.
import React from 'react';
import { X } from 'lucide-react';
import { type Category, type Series, type Lesson } from '../../../types';
import { LessonIdentityFields } from './lesson/LessonIdentityFields';
import { YoutubeField } from './lesson/YoutubeField';
import { AudioField } from './lesson/AudioField';
import { LessonImageField } from './lesson/LessonImageField';
import { LessonTextFields } from './lesson/LessonTextFields';
import { LessonPublishFields } from './lesson/LessonPublishFields';
import { useLessonForm } from './lesson/useLessonForm';
import { type LessonSaveData } from './lesson/lessonForm';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LessonSaveData) => Promise<void>;
  seriesList: Series[];
  categories: Category[];
  initialData?: Lesson | null;
  // A new lesson's starting values (for example from a visitor's suggestion); ignored when editing
  prefill?: Partial<Lesson> | null;
  // Every lesson, to number a new one after the last of its series and to refuse a number already taken
  lessons?: Pick<Lesson, 'id' | 'series_id' | 'lesson_number'>[];
}

// The number after the last lesson of a series (1 for an empty series)
const nextLessonNumber = (lessons: Pick<Lesson, 'series_id' | 'lesson_number'>[], seriesId: string) =>
  lessons.filter((l) => l.series_id === seriesId).reduce((max, l) => Math.max(max, Number(l.lesson_number) || 0), 0) + 1;

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  seriesList,
  categories,
  initialData,
  prefill = null,
  lessons = [],
}) => {
  const { form, update, error, loading, uploadingAudio, uploadAudio, submit } = useLessonForm({
    isOpen,
    initialData,
    prefill,
    seriesList,
    lessons,
    onSave,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 sticky top-0 bg-white dark:bg-stone-900 z-10">
          <div>
            <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
              {initialData ? 'تعديل الدرس' : 'إضافة درس جديد'}
            </h3>
            <p className="text-xs text-stone-500">
              أدخل بيانات الدرس، روابط التسجيل الصوتي والمرئي والتفريغ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5 text-sm">
          <LessonIdentityFields form={form} update={update} seriesList={seriesList} categories={categories} lessons={lessons} editing={!!initialData} />
          <YoutubeField form={form} update={update} />
          <AudioField form={form} update={update} uploading={uploadingAudio} onFile={uploadAudio} />
          <LessonImageField form={form} update={update} />
          <LessonTextFields form={form} update={update} />
          <LessonPublishFields form={form} update={update} />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || seriesList.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الدرس'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
