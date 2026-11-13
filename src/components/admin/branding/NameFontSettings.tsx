// The font of the sheikh's name (the top bar and the big name on the home page): the admin sees the real name in
// every font (NAME_FONTS), taps one, and saves. The page follows at once, so the choice can be judged on the site.
import React, { useEffect, useState } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { getSiteSettings, saveSiteSettings } from '../../../services/dataService';
import { DEFAULT_NAME_FONT, NAME_FONTS, nameFontOf } from '../../../constants/nameFonts';
import { applyNameFont } from '../../../lib/applyNameFont';

export const NameFontSettings: React.FC = () => {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(DEFAULT_NAME_FONT);
  const [chosen, setChosen] = useState(DEFAULT_NAME_FONT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSiteSettings(true).then((s) => {
      setName(s.banner_name);
      const id = nameFontOf(s.banner_font).id;
      setSaved(id);
      setChosen(id);
    });
    // Leaving without saving: the page goes back to the saved font
    return () => {
      getSiteSettings().then((s) => applyNameFont(s.banner_font));
    };
  }, []);

  const pick = (id: string) => {
    setChosen(id);
    applyNameFont(id);
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await saveSiteSettings({ banner_font: chosen });
      setSaved(chosen);
      setMessage({ type: 'ok', text: 'تم الحفظ. الخط الجديد ظاهر الآن في الموقع.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-amber-400" />
          <span>خط اسم الشيخ</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">اضغط على الخط المناسب لترى الاسم به، ثم «حفظ». يظهر في الشريط العلوي وفي الاسم الكبير بالصفحة الرئيسية.</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {NAME_FONTS.map((font) => {
          const on = chosen === font.id;
          return (
            <li key={font.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => pick(font.id)}
                className={`press w-full text-start rounded-2xl border-2 p-4 min-h-28 flex flex-col justify-between gap-3 transition-colors ${
                  on ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                <span style={{ fontFamily: font.family }} className="block text-2xl font-bold leading-snug text-stone-900 dark:text-stone-100 text-balance">
                  {name || 'أبو عبد الرحمن أشرف بن طه بن مازن'}
                </span>
                <span className="flex items-center justify-between gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {font.label}
                  {on && <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-label="المختار" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm font-semibold ${message.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-emerald-800 dark:text-emerald-300'}`}>
          {message.text}
        </p>
      )}

      <button type="button" onClick={save} disabled={saving || chosen === saved} className="press inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
        حفظ
      </button>
    </section>
  );
};
