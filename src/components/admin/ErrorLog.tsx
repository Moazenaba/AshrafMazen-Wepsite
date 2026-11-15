// The admin's list of the newest failures the site recorded (server functions, visitors' browsers, blocked requests).
import React, { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { clearErrorEvents, ErrorLogMissingError, getErrorEvents, type ErrorEvent } from '../../services/data/errorEvents';

const SOURCE: Record<ErrorEvent['source'], string> = { function: 'الخادم', browser: 'المتصفح', csp: 'سياسة الأمان', monitor: 'المراقبة' };

export const ErrorLog: React.FC = () => {
  const [events, setEvents] = useState<ErrorEvent[] | null>(null);
  const [problem, setProblem] = useState('');

  const load = useCallback(async () => {
    try {
      setProblem('');
      setEvents(await getErrorEvents(50));
    } catch (err) {
      setEvents([]);
      setProblem(err instanceof ErrorLogMissingError ? 'شغّل ملف `2026-11-16-error-events.sql` في Supabase لتفعيل سجل الأخطاء.' : 'تعذّر قراءة سجل الأخطاء.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clear = async () => {
    if (!window.confirm('مسح كل الأخطاء المسجّلة؟')) return;
    try {
      await clearErrorEvents();
      await load();
    } catch {
      setProblem('تعذّر مسح السجل.');
    }
  };

  return (
    <section aria-label="سجل الأخطاء" className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">سجل الأخطاء</h3>
        {events && events.length > 0 && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-semibold text-stone-700 dark:text-stone-200">
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            مسح الكل
          </button>
        )}
      </div>
      {problem && (
        <p role="alert" className="p-3 rounded-xl text-sm font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
          {problem}
        </p>
      )}
      {events === null && <p className="text-sm text-stone-500">جارٍ التحميل...</p>}
      {events && events.length === 0 && !problem && <p className="text-sm text-stone-600 dark:text-stone-400">لا توجد أخطاء مسجّلة</p>}
      {events && events.length > 0 && (
        <ul className="divide-y divide-stone-200 dark:divide-stone-800 text-sm">
          {events.map((event) => (
            <li key={event.id} className="py-2 space-y-0.5">
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {event.name} <span className="font-normal text-stone-500">· {SOURCE[event.source] ?? event.source}</span>
              </p>
              {event.message && <p className="text-stone-700 dark:text-stone-300 break-words" dir="auto">{event.message}</p>}
              <p className="text-xs text-stone-500" dir="ltr">
                {new Date(event.at).toLocaleString('ar-EG')} {event.path}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
