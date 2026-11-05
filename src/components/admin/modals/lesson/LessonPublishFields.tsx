// Lesson form: Featured flag and published / draft status.
import type { FormProps } from './lessonForm';

export const LessonPublishFields = ({ form, update }: FormProps) => {
  return (
    <>
        {/* Featured: this lesson is shown in the "اخترنا لك" block on the home page */}
        <label className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => update({ featured: e.target.checked })}
            className="w-5 h-5 accent-emerald-800"
          />
          <span className="font-semibold text-stone-700 dark:text-stone-300">عرض هذا الدرس في "اخترنا لك" بالصفحة الرئيسية</span>
        </label>

        {/* Status (Draft vs Published) */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-2">
            حالة الدرس
          </label>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={form.status === 'published'}
                onChange={() => update({ status: 'published' })}
                className="w-4 h-4 text-emerald-700 focus:ring-emerald-700"
              />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                منشور (يظهر للزوار في الموقع)
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={form.status === 'draft'}
                onChange={() => update({ status: 'draft' })}
                className="w-4 h-4 text-amber-600 focus:ring-amber-600"
              />
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                مسودة (خاص بالإدارة فقط)
              </span>
            </label>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            ملاحظة: عند تحويل الدرس إلى «منشور» يتم تسجيل تاريخ ووقت النشر تلقائياً.
          </p>
        </div>

    </>
  );
};
