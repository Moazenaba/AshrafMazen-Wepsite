// Lesson form: The written transcript and the chapters.
import { Video, FileText } from 'lucide-react';
import type { FormProps } from './lessonForm';

export const LessonTextFields = ({ form, update }: FormProps) => {
  return (
    <>
        {/* Transcript */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span>التفريغ النصي المكتوب</span>
            </label>
            <span className="text-xs text-stone-400">
              (يمكن كتابة نص تجريبي للمعاينة)
            </span>
          </div>
          <textarea
            rows={6}
            value={form.transcript}
            onChange={(e) => update({ transcript: e.target.value })}
            placeholder="اكتب تفريغ الدرس هنا لمساعدة طالب العلم على القراءة والمتابعة..."
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-amiri text-base leading-relaxed"
          />
        </div>

        {/* Chapters: one per line, so the visitor can jump to a point in the lesson */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="lesson-chapters" className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span>فصول الدرس</span>
            </label>
            <span className="text-xs text-stone-500 dark:text-stone-400">(كل فصل في سطر: ٠٠:٠٠ عنوان الفصل)</span>
          </div>
          <textarea
            id="lesson-chapters"
            rows={4}
            dir="auto"
            value={form.chaptersText}
            onChange={(e) => update({ chaptersText: e.target.value })}
            placeholder={'00:00 المقدمة\n05:30 الشرح الأول\n1:12:00 الخاتمة'}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none tabular-nums text-base leading-relaxed"
          />
        </div>

    </>
  );
};
