// The welcome sound: a short recording the site plays once per visit, on the visitor's first tap, at the volume set here.
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, Save } from 'lucide-react';
import { getSiteContent, saveWelcomeSound } from '../../../services/data/siteContent';
import { EMPTY_WELCOME, type WelcomeSound } from '../../../services/data/welcomeSoundRules';
import { FileUploadButton } from '../FileUploadButton';

const input =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const label = 'block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1';

export const WelcomeSoundSettings: React.FC = () => {
  const [draft, setDraft] = useState<WelcomeSound>(EMPTY_WELCOME);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const preview = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getSiteContent(true).then((c) => setDraft(c.welcome));
    return () => preview.current?.pause();
  }, []);

  // The preview follows the volume slider, so the admin hears what visitors will hear
  useEffect(() => {
    if (preview.current) preview.current.volume = draft.volume / 100;
  }, [draft.volume]);

  const set = <K extends keyof WelcomeSound>(key: K, value: WelcomeSound[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const togglePreview = () => {
    if (previewing) {
      preview.current?.pause();
      setPreviewing(false);
      return;
    }
    if (!draft.url) return;
    const audio = new Audio(draft.url);
    audio.volume = draft.volume / 100;
    audio.onended = () => setPreviewing(false);
    audio.onerror = () => {
      setPreviewing(false);
      setMessage({ type: 'error', text: 'تعذّر تشغيل الملف. تأكد من الرابط أو ارفعه مرة أخرى.' });
    };
    preview.current?.pause();
    preview.current = audio;
    audio.play().then(() => setPreviewing(true)).catch(() => setPreviewing(false));
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const saved = await saveWelcomeSound(draft);
      setDraft(saved);
      setMessage({ type: 'ok', text: saved.enabled ? 'تم الحفظ. يسمعه الزائر مرة واحدة مع أول ضغطة في الموقع.' : 'تم الحفظ. الصوت الترحيبي مطفأ.' });
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
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-amber-400" />
          <span>الصوت الترحيبي</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          يُسمع مرة واحدة في كل زيارة مع أول ضغطة للزائر في الموقع (المتصفحات لا تسمح بتشغيل صوت قبل أن يضغط الزائر)، ومعه زر لإيقافه.
          لا يعمل في صفحات الدروس والفيديو والريلز، ويتوقف إذا شغّل الزائر درسًا. يُفضَّل أن يكون قصيرًا وهادئًا.
        </p>
      </div>

      <label className="flex items-center gap-3 font-semibold text-stone-900 dark:text-stone-100">
        <input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-5 h-5 accent-emerald-700" />
        تشغيل الصوت الترحيبي للزوار
      </label>

      <div>
        <span className={label}>ملف الصوت (MP3 أو M4A)</span>
        <div className="flex flex-wrap items-center gap-2">
          <FileUploadButton kind="audio" label="رفع ملف صوت" onUploaded={(url) => set('url', url)} onError={(text) => setMessage({ type: 'error', text })} />
          <input aria-label="أو رابط الملف" dir="ltr" value={draft.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." className={`${input} flex-1 min-w-48`} />
        </div>
      </div>

      <div>
        <label htmlFor="welcome-volume" className={label}>
          مستوى الصوت: <span className="tabular-nums">{draft.volume}%</span>
        </label>
        <div className="flex items-center gap-3">
          <input id="welcome-volume" type="range" min={5} max={100} step={5} value={draft.volume} onChange={(e) => set('volume', Number(e.target.value))} className="flex-1 accent-emerald-700" />
          <button
            type="button"
            onClick={togglePreview}
            disabled={!draft.url}
            className="press inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm font-semibold disabled:opacity-40"
          >
            {previewing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            {previewing ? 'إيقاف' : 'استمع للتجربة'}
          </button>
        </div>
      </div>

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm font-semibold ${message.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-emerald-800 dark:text-emerald-300'}`}>
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="press inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
        حفظ
      </button>
    </section>
  );
};
