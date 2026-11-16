// The home page's big card: a picture or a video (its first frame is the picture), an optional background sound, and the texts.
import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getSiteContent, saveHomeFeature } from '../../../services/data/siteContent';
import { autoFillFromVideo, DEFAULT_BUTTON_LABEL, EMPTY_FEATURE, FEATURE_STATUS_TEXT, featureImage, featureStatus, withUploadedImage, type HomeFeature } from '../../../services/data/homeFeatureRules';
import { fetchVideoInfo } from '../../../services/data/videoInfo';
import { FileUploadButton } from '../FileUploadButton';

const input =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const label = 'block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1';
const removeButton = 'inline-flex items-center h-11 px-3 rounded-xl text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40';

export const HomeFeatureSettings: React.FC = () => {
  const [draft, setDraft] = useState<HomeFeature>(EMPTY_FEATURE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSiteContent(true).then((c) => setDraft(c.feature));
  }, []);

  const set = <K extends keyof HomeFeature>(key: K, value: HomeFeature[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Pressing Enter in the video box fills the title and the line under it from the video, where they are still empty
  const fillFromVideo = async () => {
    const info = await fetchVideoInfo(draft.videoUrl);
    if (!info) {
      setMessage({ type: 'error', text: 'لم أستطع قراءة بيانات الفيديو. اكتب العنوان بنفسك.' });
      return;
    }
    setDraft((d) => autoFillFromVideo(d, info));
    setMessage({ type: 'ok', text: 'ملأتُ العنوان والسطر الذي تحته من الفيديو، وتستطيع تعديلهما.' });
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setDraft(await saveHomeFeature(draft));
      if (draft.enabled) setMessage({ type: 'ok', text: 'تم الحفظ، والبطاقة ظاهرة الآن في الصفحة الرئيسية (خلال ثوانٍ).' });
      else if (featureImage(draft)) setMessage({ type: 'error', text: 'تم الحفظ، لكن البطاقة مطفأة فلن تظهر. علّم مربع «إظهار هذه البطاقة» ثم احفظ.' });
      else setMessage({ type: 'ok', text: 'تم الحفظ. البطاقة مطفأة، ويظهر مكانها الدرس المميز.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
      <div>
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">البطاقة الكبيرة في أول الصفحة الرئيسية</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">صورة أو فيديو يظهران أول ما يفتح الزائر الموقع. إن أطفأتها يظهر مكانها الدرس المميز.</p>
      </div>

      <label className="flex items-center gap-3 font-semibold text-stone-900 dark:text-stone-100">
        <input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-5 h-5 accent-emerald-700" />
        إظهار هذه البطاقة
      </label>

      <p role="status" className={`text-sm font-semibold ${featureStatus(draft) === 'shown' ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
        {FEATURE_STATUS_TEXT[featureStatus(draft)]}
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="hf-video" className={label}>رابط فيديو يوتيوب (اختياري)</label>
            <input
              id="hf-video"
              dir="ltr"
              value={draft.videoUrl}
              onChange={(e) => set('videoUrl', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void fillFromVideo();
                }
              }}
              placeholder="https://youtu.be/..."
              className={input}
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">اضغط Enter بعد اللصق: يظهر أول إطار منه كصورة، ويُكتب العنوان تلقائياً. وعند الضغط على البطاقة يفتح الفيديو.</p>
          </div>

          <div>
            <span className={label}>صورة (اختيارية)</span>
            <div className="flex flex-wrap items-center gap-2">
              <FileUploadButton
                kind="hero"
                label="رفع صورة"
                onUploaded={(url) => {
                  setDraft((d) => withUploadedImage(d, url));
                  setMessage({ type: 'ok', text: 'تم رفع الصورة. اضغط «حفظ» لتظهر في الموقع.' });
                }}
                onError={(text) => setMessage({ type: 'error', text })}
              />
              <input aria-label="أو رابط صورة" dir="ltr" value={draft.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." className={`${input} flex-1 min-w-40`} />
              {draft.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, imageUrl: '', enabled: featureImage({ ...d, imageUrl: '' }) ? d.enabled : false }));
                    setMessage({ type: 'ok', text: 'أُزيلت الصورة. اضغط «حفظ» لتثبيت ذلك.' });
                  }}
                  className={removeButton}
                >
                  إزالة الصورة
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">لو تركتها فارغة مع رابط فيديو، تُستعمل صورة الفيديو. الأنسب صورة عرضية ١٦:٩.</p>
          </div>

          <div>
            <span className={label}>صوت في الخلفية (اختياري)</span>
            <div className="flex flex-wrap items-center gap-2">
              <FileUploadButton
                kind="audio"
                label="رفع ملف صوت"
                onUploaded={(url) => {
                  set('audioUrl', url);
                  setMessage({ type: 'ok', text: 'تم رفع الصوت. اضغط «حفظ». يعمل بهدوء بعد أول لمسة من الزائر.' });
                }}
                onError={(text) => setMessage({ type: 'error', text })}
              />
              <input aria-label="أو رابط صوت" dir="ltr" value={draft.audioUrl} onChange={(e) => set('audioUrl', e.target.value)} placeholder="https://..." className={`${input} flex-1 min-w-40`} />
              {draft.audioUrl && (
                <button type="button" onClick={() => set('audioUrl', '')} className={removeButton}>
                  إزالة الصوت
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hf-title" className={label}>العنوان</label>
              <input id="hf-title" value={draft.title} onChange={(e) => set('title', e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="hf-sub" className={label}>السطر تحت العنوان</label>
              <input id="hf-sub" value={draft.subtitle} onChange={(e) => set('subtitle', e.target.value)} className={input} />
            </div>
          </div>
          <div>
            <label htmlFor="hf-btn" className={label}>كلمة الزر</label>
            <input id="hf-btn" value={draft.buttonLabel} onChange={(e) => set('buttonLabel', e.target.value)} placeholder={DEFAULT_BUTTON_LABEL} className={input} />
          </div>
        </div>

        <div>
          <span className={label}>كما ستظهر</span>
          <div className="aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
            {featureImage(draft) ? <img src={featureImage(draft)} alt="معاينة الصورة" className="w-full h-full object-cover" /> : <span className="text-sm text-stone-500">لا توجد صورة بعد</span>}
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
