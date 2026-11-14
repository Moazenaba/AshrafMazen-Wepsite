// The live broadcast banner. YouTube needs nothing from the admin: when the Sheikh's own channel goes live the banner and
// the page /live appear by themselves (api/live.ts), and a live of any other channel can never show. Telegram cannot be
// detected or embedded, so here the admin switches a Telegram broadcast on and gives its link; it opens Telegram.
import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getSiteContent, saveLiveStream } from '../../../services/data/siteContent';
import { EMPTY_LIVE, type LiveStream } from '../../../services/data/liveStreamRules';

const input =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const label = 'block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1';

type YoutubeState = 'checking' | 'live' | 'off' | 'unknown';

export const LiveStreamSettings: React.FC = () => {
  const [draft, setDraft] = useState<LiveStream>(EMPTY_LIVE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [youtube, setYoutube] = useState<YoutubeState>('checking');

  useEffect(() => {
    getSiteContent(true).then((c) => setDraft(c.live));
    fetch('/api/live')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setYoutube(data ? (data.live ? 'live' : 'off') : 'unknown'))
      .catch(() => setYoutube('unknown'));
  }, []);

  const set = <K extends keyof LiveStream>(key: K, value: LiveStream[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const saved = await saveLiveStream(draft);
      setDraft(saved);
      setMessage({ type: 'ok', text: saved.enabled ? 'تم الحفظ. شريط بث تليجرام ظاهر الآن في كل صفحات الموقع (خلال ثوانٍ).' : 'تم الحفظ. بث تليجرام مطفأ.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  const youtubeText: Record<YoutubeState, string> = {
    checking: 'جارٍ الفحص…',
    live: 'قناة الشيخ على البث الآن، والشريط ظاهر للزوار.',
    off: 'قناة الشيخ ليست على البث الآن.',
    unknown: 'تعذّر فحص القناة الآن.',
  };

  return (
    <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span>البث المباشر</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          شريط «بث مباشر الآن» يظهر أعلى كل صفحات الموقع.
        </p>
      </div>

      <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-4 space-y-1">
        <p className="font-semibold text-stone-900 dark:text-stone-100">يوتيوب: تلقائي</p>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          لا تحتاج أن تفعل شيئاً. عندما تبدأ قناة الشيخ بثاً مباشراً على يوتيوب يظهر الشريط ويُعرض البث داخل الموقع، وعندما ينتهي يختفي. ولا يظهر أي بث
          من قناة أخرى.
        </p>
        <p role="status" className={`text-sm font-semibold ${youtube === 'live' ? 'text-red-700 dark:text-red-400' : 'text-stone-500 dark:text-stone-400'}`}>
          الآن: {youtubeText[youtube]}
        </p>
      </div>

      <div className="space-y-4">
        <p className="font-semibold text-stone-900 dark:text-stone-100">تليجرام: بتشغيل يدوي</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 -mt-2">
          تليجرام لا يمكن اكتشاف بثه ولا عرضه داخل الموقع، فيظهر زر يفتح تليجرام. شغِّل المفتاح قبل البث وأطفئه بعده.
        </p>
        <label className="flex items-center gap-3 font-semibold text-stone-900 dark:text-stone-100">
          <input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-5 h-5 accent-red-600" />
          بث تليجرام شغّال الآن
        </label>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="live-tg" className={label}>رابط البث على تليجرام</label>
            <input id="live-tg" dir="ltr" value={draft.telegramUrl} onChange={(e) => set('telegramUrl', e.target.value)} placeholder="https://t.me/..." className={input} />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">رابط القناة أو المجموعة التي فيها البث.</p>
          </div>
          <div>
            <label htmlFor="live-title" className={label}>عنوان البث (اختياري)</label>
            <input id="live-title" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: درس الفقه بعد المغرب" className={input} />
          </div>
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
