// The "اخترنا لك" lessons in the order the home page shows them: the first one is the one shown.
import React from 'react';
import { useFeaturedOrder } from '../../pages/admin/dashboard/hooks/useFeaturedOrder';
import type { LessonAdminItem } from '../../pages/admin/dashboard/types';
import { MoveButtons } from './MoveButtons';

export const FeaturedOrderPanel: React.FC<{ lessons: LessonAdminItem[] }> = ({ lessons }) => {
  const order = useFeaturedOrder(lessons);
  if (order.items.length === 0) return null;
  return (
    <section aria-labelledby="featured-order-heading" className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
      <div>
        <h3 id="featured-order-heading" className="font-bold text-stone-900 dark:text-stone-100">ترتيب «اخترنا لك» في الصفحة الرئيسية</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">الدرس الأول في القائمة هو الذي يظهر في الصفحة الرئيسية.</p>
      </div>
      {order.error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{order.error}</p>}
      <ol className="divide-y divide-stone-200 dark:divide-stone-800">
        {order.items.map((lesson, index) => (
          <li key={lesson.id} className="flex items-center gap-3 py-2">
            <span className="w-7 text-center text-sm font-bold text-stone-500">{index + 1}</span>
            <span className="flex-1 min-w-0 truncate text-sm text-stone-900 dark:text-stone-100">
              {lesson.title}
              {lesson.status === 'draft' && <span className="ms-2 text-xs text-amber-700 dark:text-amber-400">(مسودة، لن تظهر)</span>}
            </span>
            <MoveButtons name={lesson.title} canUp={order.canMove(lesson.id, -1)} canDown={order.canMove(lesson.id, 1)} busy={order.busy} onMove={(step) => order.move(lesson.id, step)} />
          </li>
        ))}
      </ol>
    </section>
  );
};
