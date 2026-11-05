// Auto-next: the next lesson starts unless the visitor cancels.
import React from 'react';
import { Link } from 'react-router-dom';
import { type Lesson } from '../../types';

export const AutoNextBanner: React.FC<{ countdown: number; nextLesson: Pick<Lesson, 'id' | 'title'>; onCancel: () => void }> = ({
  countdown,
  nextLesson,
  onCancel,
}) => (
  <section aria-label="الدرس التالي" className="card p-5 flex flex-wrap items-center justify-between gap-4">
    <div className="space-y-1 min-w-0">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        الدرس التالي بعد {new Intl.NumberFormat('ar-EG').format(countdown)} ثوانٍ
      </p>
      <p className="font-semibold text-stone-900 dark:text-stone-100">{nextLesson.title}</p>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="press inline-flex items-center h-11 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold"
      >
        إلغاء
      </button>
      <Link
        to={`/lesson/${nextLesson.id}`}
        className="press inline-flex items-center h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold"
      >
        ابدأ الآن
      </Link>
    </div>
  </section>
);
