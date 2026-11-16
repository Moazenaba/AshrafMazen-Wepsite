// The admin's view of the three big saved lists: size, item count, and the button that brings back the previous copy.
import React, { useCallback, useEffect, useState } from 'react';
import { getRecordInfo, restorePrevious, type RecordInfo } from '../../services/data/recordAdmin';

const COLOR: Record<RecordInfo['level'], string> = {
  ok: 'text-stone-700 dark:text-stone-300',
  warn: 'text-amber-700 dark:text-amber-400',
  full: 'text-red-700 dark:text-red-400',
};
const kb = (bytes: number) => `${Math.round(bytes / 1000)} ك.ب`;

export const RecordSizes: React.FC = () => {
  const [records, setRecords] = useState<RecordInfo[] | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setRecords(await getRecordInfo());
    } catch (err) {
      setRecords([]);
      setMessage(err instanceof Error ? err.message : 'تعذّرت قراءة السجلات.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const restore = async (record: RecordInfo) => {
    if (!window.confirm(`استرجاع النسخة السابقة من «${record.label}»؟ تُستبدل النسخة الحالية بها.`)) return;
    try {
      setMessage('');
      await restorePrevious(record.key);
      setMessage(`تم استرجاع النسخة السابقة من «${record.label}».`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'تعذّر الاسترجاع.');
    }
  };

  return (
    <section aria-label="حجم السجلات المحفوظة" className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
      <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">حجم السجلات المحفوظة</h3>
      {message && (
        <p role="status" className="p-3 rounded-xl text-sm font-semibold bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
          {message}
        </p>
      )}
      {records === null && <p className="text-sm text-stone-500">جارٍ التحميل...</p>}
      <ul className="divide-y divide-stone-200 dark:divide-stone-800 text-sm">
        {(records ?? []).map((record) => (
          <li key={record.key} className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-100">{record.label}</p>
              <p className={`tabular-nums ${COLOR[record.level]}`}>
                {kb(record.bytes)}
                {record.items !== null ? ` · ${record.items} عنصر` : ' · تعذّرت القراءة'}
                {record.level === 'warn' ? ' · يقترب من الحد' : record.level === 'full' ? ' · تجاوز الحد' : ''}
              </p>
            </div>
            {record.hasPrevious && (
              <button type="button" onClick={() => restore(record)} className="h-11 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-semibold text-stone-800 dark:text-stone-200">
                استرجاع النسخة السابقة
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
