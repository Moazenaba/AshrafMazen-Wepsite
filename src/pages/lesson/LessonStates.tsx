// What the lesson page shows while loading, and when the lesson does not exist or is not published.
import React from 'react';
import { Link } from 'react-router-dom';

export const LessonSkeleton: React.FC = () => (
  <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6" aria-busy="true">
    <div className="h-5 w-56 bg-stone-200 dark:bg-stone-900 rounded" />
    <div className="h-10 w-3/4 bg-stone-200 dark:bg-stone-900 rounded" />
    <div className="aspect-video bg-stone-200 dark:bg-stone-900 rounded-2xl" />
  </div>

);

export const LessonNotFound: React.FC = () => (
  <div className="w-full px-4 sm:px-6 lg:px-8 py-20 space-y-4">
    <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">الدرس غير متاح</h1>
    <p className="text-stone-600 dark:text-stone-400">هذا الدرس غير موجود، أو لم يُنشر بعد.</p>
    <Link to="/" className="inline-flex items-center min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
      العودة للرئيسية
    </Link>
  </div>

);
