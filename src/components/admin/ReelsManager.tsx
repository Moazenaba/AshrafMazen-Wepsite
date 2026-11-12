// The admin's "الريلز" tab: the channel's YouTube Shorts arrive by themselves; here the admin orders them,
// removes any (a removed one never comes back from YouTube), renames them, or adds a short by its link.
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { getYouTubeId } from '../../lib/youtube';
import { fetchShorts, reelsChanged } from '../../lib/reels';
import { adminReels, settingsFromAdmin, type AdminReel } from '../../lib/reelsRules';
import { getReelsSettings, saveReelsSettings } from '../../services/data/reels';
import { moveItem } from '../../services/data/siteContentRules';

const input =
  'h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';

export const ReelsManager: React.FC = () => {
  const [list, setList] = useState<AdminReel[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [savedJson, setSavedJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([fetchShorts(), getReelsSettings()])
      .then(([fetched, settings]) => {
        const items = adminReels(fetched, settings);
        setList(items);
        setRemoved(settings.hidden);
        setTitles(settings.titles);
        setSavedJson(JSON.stringify(settings));
      })
      .catch((err) => setMessage({ type: 'error', text: err?.message || 'تعذّر تحميل الريلز.' }))
      .finally(() => setLoading(false));
  }, []);

  const current = useMemo(() => settingsFromAdmin(list, removed, titles), [list, removed, titles]);
  const dirty = JSON.stringify(current) !== savedJson;
  const freshCount = list.filter((r) => r.fresh).length;

  const remove = (id: string) => {
    setList((l) => l.filter((r) => r.id !== id));
    setRemoved((h) => [...h, id]);
  };
  const restoreAll = () => setRemoved([]);

  const add = () => {
    const id = getYouTubeId(link.trim()) || link.trim().match(/shorts\/([A-Za-z0-9_-]{11})/)?.[1];
    if (!id) return setMessage({ type: 'error', text: 'الرابط غير مفهوم. الصق رابط المقطع من يوتيوب.' });
    if (list.some((r) => r.id === id)) return setMessage({ type: 'error', text: 'هذا المقطع موجود بالفعل.' });
    setList((l) => [{ id, title: '', fresh: false }, ...l]);
    setRemoved((h) => h.filter((x) => x !== id));
    setLink('');
    setMessage({ type: 'ok', text: 'أُضيف المقطع في أول القائمة. اكتب له عنواناً ثم اضغط «حفظ التغييرات».' });
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await saveReelsSettings(current);
      setSavedJson(JSON.stringify(current));
      setList((l) => l.map((r) => ({ ...r, fresh: false })));
      reelsChanged(current);
      setMessage({ type: 'ok', text: 'تم الحفظ، والريلز ظاهرة الآن بهذا الترتيب.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">الريلز (المقاطع القصيرة)</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
              تأتي تلقائياً من Shorts قناة الشيخ على يوتيوب وتتحدث كل ٦ ساعات، والجديد منها يظهر أولاً. رتّبها بالأسهم، واحذف ما لا تريده
              (المحذوف لا يعود تلقائياً أبداً)، أو أضف مقطعاً برابطه.
            </p>
          </div>
          <button type="button" onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            حفظ التغييرات
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <input aria-label="رابط مقطع من يوتيوب" dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/shorts/..." className={`${input} w-full sm:w-96`} />
          <button type="button" onClick={add} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold">
            <Plus className="w-4 h-4" aria-hidden="true" />
            إضافة
          </button>
          {removed.length > 0 && (
            <button type="button" onClick={restoreAll} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800">
              <Undo2 className="w-4 h-4" aria-hidden="true" />
              إرجاع المحذوف ({new Intl.NumberFormat('ar-EG').format(removed.length)})
            </button>
          )}
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {new Intl.NumberFormat('ar-EG').format(list.length)} مقطع
          {freshCount > 0 ? ` · ${new Intl.NumberFormat('ar-EG').format(freshCount)} جديد من يوتيوب` : ''}
          {dirty ? ' · تغييرات لم تُحفظ' : ''}
        </p>
        {message && (
          <p role={message.type === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'}`}>
            {message.text}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="جارٍ التحميل" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">لا توجد مقاطع بعد. أضف مقطعاً برابطه، أو انتظر أن تُجلب من يوتيوب.</p>
      ) : (
        <ol className="space-y-2">
          {list.map((reel, i) => (
            <li key={reel.id} className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="w-6 text-center tabular-nums font-bold text-stone-500">{new Intl.NumberFormat('ar-EG').format(i + 1)}</span>
              <img src={`https://i.ytimg.com/vi/${reel.id}/default.jpg`} alt="" className="w-12 h-16 object-cover rounded-lg bg-stone-200 dark:bg-stone-800" />
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={`reel-${reel.id}`} className="sr-only">عنوان المقطع</label>
                <input id={`reel-${reel.id}`} value={titles[reel.id] ?? ''} onChange={(e) => setTitles((t) => ({ ...t, [reel.id]: e.target.value }))} placeholder={reel.title || 'عنوان المقطع'} className={`${input} w-full`} />
                {reel.fresh && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">جديد من يوتيوب</span>}
              </div>
              <button type="button" aria-label="لأعلى" disabled={i === 0} onClick={() => setList((l) => moveItem(l, i, -1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30">
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label="لأسفل" disabled={i === list.length - 1} onClick={() => setList((l) => moveItem(l, i, 1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30">
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label={`حذف ${reel.title || 'المقطع'}`} onClick={() => remove(reel.id)} className="w-10 h-10 flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
