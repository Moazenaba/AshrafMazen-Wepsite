// The home page's featured card: the admin's own picture, texts, and the video its button opens.
import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getSiteContent, saveHomeFeature } from '../../../services/data/siteContent';
import { DEFAULT_BUTTON_LABEL, EMPTY_FEATURE, type HomeFeature } from '../../../services/data/homeFeatureRules';
import { FileUploadButton } from '../FileUploadButton';

const input =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const label = 'block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1';

export const HomeFeatureSettings: React.FC = () => {
  const [draft, setDraft] = useState<HomeFeature>(EMPTY_FEATURE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSiteContent(true).then((c) => setDraft(c.feature));
  }, []);

  const set = <K extends keyof HomeFeature>(key: K, value: HomeFeature[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setDraft(await saveHomeFeature(draft));
      setMessage({ type: 'ok', text: draft.enabled ? 'تم الحفظ، والصورة ظاهرة الآن في الصفحة الرئيسية.' : 'تم الحفظ. البطاقة مطفأة، ويظهر مكانها الدرس المميز.' });
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
          <span>صورة واجهة الصفحة الرئيسية</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          البطاقة الكبيرة أول ما يفتح الموقع. اختر صورتها بنفسك، والفيديو الذي يفتحه زر «{DEFAULT_BUTTON_LABEL}» (يمكن أن تختلف الصورة عن الفيديو).
          إذا أطفأتها يظهر مكانها الدرس المميز كما كان.
        </p>
      </div>

      <label className="flex items-center gap-3 font-semibold text-stone-900 dark:text-stone-100">
        <input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-5 h-5 accent-emerald-700" />
        إظهار هذه البطاقة في الصفحة الرئيسية
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <span className={label}>الصورة</span>
            <div className="flex flex-wrap items-center gap-2">
              <FileUploadButton kind="hero" label="رفع صورة" onUploaded={(url) => set('imageUrl', url)} onError={(text) => setMessage({ type: 'error', text })} />
              <input aria-label="أو رابط صورة" dir="ltr" value={draft.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." className={`${input} flex-1 min-w-48`} />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">الأنسب صورة عرضية بنسبة ١٦:٩ (مثلاً ١٢٨٠×٧٢٠)، حتى ٨ ميجابايت.</p>
          </div>
          <div>
            <label htmlFor="hf-video" className={label}>رابط الفيديو</label>
            <input id="hf-video" dir="ltr" value={draft.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://youtu.be/...  أو  /lesson/..." className={input} />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">رابط يوتيوب يُشغَّل داخل الموقع. ويصلح أيضاً رابط درس أو قائمة من الموقع نفسه، أو أي رابط آخر يفتح في نافذة جديدة.</p>
          </div>
          <div>
            <label htmlFor="hf-title" className={label}>العنوان (اختياري)</label>
            <input id="hf-title" value={draft.title} onChange={(e) => set('title', e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="hf-sub" className={label}>سطر تحت العنوان (اختياري)</label>
            <input id="hf-sub" value={draft.subtitle} onChange={(e) => set('subtitle', e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="hf-btn" className={label}>نص الزر</label>
            <input id="hf-btn" value={draft.buttonLabel} onChange={(e) => set('buttonLabel', e.target.value)} placeholder={DEFAULT_BUTTON_LABEL} className={input} />
          </div>
        </div>

        <div>
          <span className={label}>معاينة</span>
          <div className="aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
            {draft.imageUrl ? <img src={draft.imageUrl} alt="معاينة الصورة" className="w-full h-full object-cover" /> : <span className="text-sm text-stone-500">لا توجد صورة بعد</span>}
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
