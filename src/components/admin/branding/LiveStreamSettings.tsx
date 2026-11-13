// The live broadcast: one switch shows a banner on every page of the site. A YouTube live plays inside the site (/live);
// Telegram cannot be embedded, so it is a button that opens Telegram.
import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getSiteContent, saveLiveStream } from '../../../services/data/siteContent';
import { EMPTY_LIVE, type LiveStream } from '../../../services/data/liveStreamRules';

const input =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const label = 'block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1';

export const LiveStreamSettings: React.FC = () => {
  const [draft, setDraft] = useState<LiveStream>(EMPTY_LIVE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSiteContent(true).then((c) => setDraft(c.live));
  }, []);

  const set = <K extends keyof LiveStream>(key: K, value: LiveStream[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const saved = await saveLiveStream(draft);
      setDraft(saved);
      setMessage({ type: 'ok', text: saved.enabled ? 'تم الحفظ. شريط البث المباشر ظاهر الآن في كل صفحات الموقع (قد يتأخر دقيقة عند بعض الزوار).' : 'تم الحفظ. شريط البث مطفأ.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span>البث المباشر</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          عند التشغيل يظهر شريط «بث مباشر الآن» أعلى كل صفحات الموقع. بث يوتيوب يُشاهد داخل الموقع في صفحة خاصة، أما تليجرام فلا يمكن عرضه داخل الموقع،
          فيظهر زر يفتح تليجرام. شغِّل المفتاح قبل البث وأطفئه بعده.
        </p>
      </div>

      <label className="flex items-center gap-3 font-semibold text-stone-900 dark:text-stone-100">
        <input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-5 h-5 accent-red-600" />
        البث المباشر شغّال الآن
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="live-title" className={label}>عنوان البث (اختياري)</label>
          <input id="live-title" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: درس الفقه بعد المغرب" className={input} />
        </div>
        <div>
          <label htmlFor="live-yt" className={label}>رابط البث على يوتيوب</label>
          <input id="live-yt" dir="ltr" value={draft.youtubeUrl} onChange={(e) => set('youtubeUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={input} />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">رابط البث نفسه (watch أو live أو youtu.be)، لا رابط القناة.</p>
        </div>
        <div>
          <label htmlFor="live-tg" className={label}>رابط البث على تليجرام</label>
          <input id="live-tg" dir="ltr" value={draft.telegramUrl} onChange={(e) => set('telegramUrl', e.target.value)} placeholder="https://t.me/..." className={input} />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">رابط القناة أو المجموعة التي فيها البث.</p>
        </div>
      </div>

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'}`}>
          {message.text}
        </p>
      )}

      <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
        حفظ
      </button>
    </section>
  );
};
