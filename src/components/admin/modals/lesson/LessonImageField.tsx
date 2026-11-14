// Lesson form: the lesson's own picture (optional). Shown next to the lesson's title wherever the lesson appears
// (the home page's large card, the lists, the series page), instead of the YouTube picture or the icon.
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FileUploadButton } from '../../FileUploadButton';
import type { FormProps } from './lessonForm';

export const LessonImageField = ({ form, update }: FormProps) => {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-stone-800 dark:text-stone-200">صورة الدرس (اختياري)</span>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        تظهر بجوار اسم الدرس في الصفحة الرئيسية والقوائم بدلاً من صورة يوتيوب أو الأيقونة. الأنسب صورة عرضية ١٦:٩، حتى ٨ ميجابايت (PNG أو JPG أو WebP).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <FileUploadButton
          kind="hero"
          label="رفع صورة"
          onUploaded={(url) => {
            setError(null);
            update({ imageUrl: url });
          }}
          onError={setError}
        />
        <input
          aria-label="أو رابط صورة"
          dir="ltr"
          value={form.imageUrl}
          onChange={(e) => update({ imageUrl: e.target.value })}
          placeholder="https://..."
          className="flex-1 min-w-48 h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
        {form.imageUrl && (
          <button
            type="button"
            onClick={() => update({ imageUrl: '' })}
            className="inline-flex items-center gap-1 h-10 px-3 rounded-xl text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            إزالة الصورة
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {form.imageUrl && (
        <img src={form.imageUrl} alt="معاينة صورة الدرس" className="w-48 aspect-video object-cover rounded-xl border border-stone-200 dark:border-stone-700" />
      )}
    </div>
  );
};
