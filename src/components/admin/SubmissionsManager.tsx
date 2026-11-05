import React, { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Inbox, Loader2, Trash2, X } from 'lucide-react';
import {
  createBook,
  deleteSubmission,
  getSubmissions,
  reviewSubmission,
  type Submission,
  type SubmissionStatus,
} from '../../services/dataService';

const KIND_LABEL: Record<Submission['kind'], string> = {
  book: 'اقتراح كتاب',
  audio: 'اقتراح مادة صوتية',
  video: 'اقتراح فيديو',
  correction: 'تصحيح خطأ',
  removal: 'طلب إزالة',
};

const STATUS_LABEL: Record<SubmissionStatus, string> = { pending: 'بانتظار المراجعة', approved: 'مقبول', rejected: 'مرفوض' };
const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  rejected: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
};

// The admin's "الطلبات" tab. Visitors cannot change anything on the site themselves: what they send waits here,
// and only an approval acts on it. Accepting a suggested book adds it to the library; every other kind is
// marked accepted and the admin makes the change in the matching tab.
export const SubmissionsManager: React.FC<{ onCountChange?: (pending: number) => void }> = ({ onCountChange }) => {
  const [filter, setFilter] = useState<SubmissionStatus>('pending');
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await getSubmissions(filter));
      if (filter === 'pending') onCountChange?.((await getSubmissions('pending')).length);
    } catch (err: any) {
      setError(err?.message || 'تعذّر تحميل الطلبات.');
    } finally {
      setLoading(false);
    }
  }, [filter, onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (item: Submission, action: 'approve' | 'reject' | 'delete') => {
    try {
      setBusy(item.id);
      setError(null);
      if (action === 'delete') {
        await deleteSubmission(item.id);
      } else if (action === 'approve') {
        if (item.kind === 'book') {
          await createBook({ title: item.title, author: item.author, description: item.details, file_url: item.url, status: 'published' });
        }
        await reviewSubmission(item.id, 'approved', notes[item.id] || '');
      } else {
        await reviewSubmission(item.id, 'rejected', notes[item.id] || '');
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'تعذّر تنفيذ العملية.');
    } finally {
      setBusy(null);
    }
  };

  const rows: [string, string | null][] = [];
  const addRow = (name: string, value: string) => value && rows.push([name, value]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
        <div>
          <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">طلبات الزوار</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            الزوار لا يملكون حسابات ولا يضيفون أو يعدّلون أو يحذفون شيئاً بأنفسهم. ما يرسلونه من صفحة «شارك» ينتظر هنا، ولا يتغيّر
            شيء في الموقع إلا بموافقتك. قبول كتاب مقترح يضيفه إلى المكتبة مباشرة؛ بقية الأنواع تُعلَّم «مقبول» وتنفّذ التغيير بنفسك من التبويب المناسب.
          </p>
        </div>
        <div role="group" aria-label="تصفية الطلبات" className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
          {(['pending', 'approved', 'rejected'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`h-10 px-4 rounded-lg text-sm font-semibold ${
                filter === value ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300' : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              {STATUS_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm font-semibold">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="جارٍ التحميل" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <Inbox className="w-8 h-8 mx-auto text-stone-400" aria-hidden="true" />
          <p className="text-stone-600 dark:text-stone-400">لا توجد طلبات {STATUS_LABEL[filter]}.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            rows.length = 0;
            addRow('المؤلف', item.author);
            addRow('الصفحة المقصودة', item.target);
            addRow('وسيلة التواصل', item.contact);
            return (
              <li key={item.id} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-800 text-white">{KIND_LABEL[item.kind]}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                  <time dateTime={item.created_at} className="text-xs text-stone-600 dark:text-stone-400">
                    {new Date(item.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>

                <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100">{item.title}</h3>
                {item.details && <p className="whitespace-pre-line text-stone-800 dark:text-stone-200">{item.details}</p>}

                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {rows.map(([name, value]) => (
                    <div key={name} className="flex gap-2">
                      <dt className="text-stone-600 dark:text-stone-400 shrink-0">{name}:</dt>
                      <dd className="text-stone-900 dark:text-stone-100 break-all">{value}</dd>
                    </div>
                  ))}
                </dl>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    dir="ltr"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:underline break-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {item.url}
                  </a>
                )}

                {item.status === 'pending' ? (
                  <div className="space-y-3 pt-1">
                    <label className="block">
                      <span className="sr-only">ملاحظة الإدارة</span>
                      <input
                        value={notes[item.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                        placeholder="ملاحظة للأرشيف (اختيارية)"
                        maxLength={1000}
                        className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy === item.id}
                        onClick={() => act(item, 'approve')}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold disabled:opacity-60"
                      >
                        {busy === item.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
                        {item.kind === 'book' ? 'قبول وإضافة للمكتبة' : 'قبول'}
                      </button>
                      <button
                        type="button"
                        disabled={busy === item.id}
                        onClick={() => act(item, 'reject')}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold disabled:opacity-60"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                        رفض
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-sm text-stone-600 dark:text-stone-400">{item.admin_note ? `ملاحظة: ${item.admin_note}` : ''}</p>
                    <button
                      type="button"
                      disabled={busy === item.id}
                      onClick={() => act(item, 'delete')}
                      aria-label={`حذف الطلب: ${item.title}`}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      حذف
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
