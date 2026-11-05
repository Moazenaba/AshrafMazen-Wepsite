// Lesson form: Series, lesson number and title.
import type { Category, Series } from '../../../../types';
import { nextLessonNumber, type FormProps, type LessonRef } from './lessonForm';

export const LessonIdentityFields = ({ form, update, seriesList, categories, lessons, editing }: FormProps & {
  seriesList: Series[];
  categories: Category[];
  lessons: LessonRef[];
  editing: boolean;
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  return (
    <>
        {/* Series & Lesson Number */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              السلسلة العلمية <span className="text-red-500">*</span>
            </label>
            {seriesList.length === 0 ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                تنبيه: لا توجد سلاسل مضافة حتى الآن. يرجى إضافة سلسلة علمية أولاً لتتمكن من إدراج الدروس فيها.
              </div>
            ) : (
              <select
                required
                value={form.seriesId}
                onChange={(e) =>
                  update(
                    editing
                      ? { seriesId: e.target.value }
                      : { seriesId: e.target.value, lessonNumber: nextLessonNumber(lessons, e.target.value) }
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {categoryMap.get(s.category_id) ? `[${categoryMap.get(s.category_id)}] ` : ''}
                    {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              رقم الدرس <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.lessonNumber}
              onChange={(e) => update({ lessonNumber: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Lesson Title */}
        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            عنوان الدرس <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="مثال: باب فضل التوحيد وما يكفر من الذنوب..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-amiri text-base font-bold"
          />
        </div>

    </>
  );
};
