// Admin: the sayings strip on the home page (one row per hadith or saying: add, edit, move, delete) and the hadith under the name.
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { getSiteContent, saveHeroQuote, saveQuotes } from '../../services/data/siteContent';
import { DEFAULT_HERO, MAX_QUOTES, QUOTE_LIMITS, moveItem, type HeroQuote } from '../../services/data/siteContentRules';
import type { TickerQuote } from '../../constants/tickerQuotes';

type Row = TickerQuote & { key: number };

const field =
  'w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700';
const iconButton =
  'w-9 h-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent';

export const QuotesManager: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [hero, setHero] = useState<HeroQuote>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const nextKey = useRef(1);
  const lastRow = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getSiteContent(true)
      .then((content) => {
        setRows(content.quotes.map((q) => ({ ...q, key: nextKey.current++ })));
        setHero(content.hero);
      })
      .catch(() => setMessage({ type: 'error', text: 'تعذّر تحميل الأحاديث والأقوال الحالية.' }))
      .finally(() => setLoading(false));
  }, []);

  const change = (update: () => void) => {
    update();
    setDirty(true);
    setMessage(null);
  };

  const addRow = () => {
    if (rows.length >= MAX_QUOTES) return;
    change(() => setRows((list) => [...list, { text: '', source: '', key: nextKey.current++ }]));
    setTimeout(() => lastRow.current?.focus(), 0);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveHeroQuote({ ...hero, text: hero.text.trim() });
      const saved = await saveQuotes(rows);
      setRows(saved.map((q) => ({ ...q, key: nextKey.current++ })));
      setDirty(false);
      setMessage({ type: 'success', text: 'تم الحفظ، وظهر التغيير في الصفحة الرئيسية.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ. حاول مرة أخرى.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-10 text-center text-stone-500 font-cairo">جارٍ التحميل...</p>;

  return (
    <div className="space-y-8 font-cairo">
      <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5" aria-labelledby="hero-quote-title">
        <div>
          <h3 id="hero-quote-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            الحديث تحت الاسم في الصفحة الرئيسية
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">الحديث الكبير الذي يظهر تحت اسم الشيخ مباشرة.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            مقدمة (مثل: قال رسول الله ﷺ:)
            <input className={`${field} mt-1.5`} maxLength={QUOTE_LIMITS.intro} value={hero.intro} onChange={(e) => change(() => setHero({ ...hero, intro: e.target.value }))} />
          </label>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            نص الحديث
            <textarea className={`${field} mt-1.5 font-amiri text-base`} rows={2} maxLength={QUOTE_LIMITS.text} value={hero.text} onChange={(e) => change(() => setHero({ ...hero, text: e.target.value }))} />
          </label>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            المصدر
            <input className={`${field} mt-1.5`} maxLength={QUOTE_LIMITS.source} value={hero.source} onChange={(e) => change(() => setHero({ ...hero, source: e.target.value }))} />
          </label>
        </div>
      </section>

      <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5" aria-labelledby="ticker-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="ticker-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">
              شريط الأحاديث والأقوال ({rows.length})
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              كل حديث أو قول في سطر مستقل. اكتب المصدر الحقيقي لكل واحد. لو حذفت الكل يختفي الشريط من الصفحة الرئيسية.
            </p>
          </div>
          <button type="button" onClick={addRow} disabled={rows.length >= MAX_QUOTES} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50">
            <Plus className="w-4 h-4" aria-hidden="true" />
            إضافة حديث أو قول
          </button>
        </div>

        {rows.length === 0 && <p className="py-6 text-center text-sm text-stone-500">لا توجد أحاديث. الشريط مخفي الآن. اضغط «إضافة حديث أو قول».</p>}

        <ol className="space-y-3">
          {rows.map((row, i) => (
            <li key={row.key} className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 sm:p-4 grid gap-3 sm:grid-cols-[2rem_1fr_auto] items-start">
              <span className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300">{i + 1}</span>
              <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
                <textarea
                  ref={i === rows.length - 1 ? lastRow : undefined}
                  aria-label={`نص الحديث ${i + 1}`}
                  placeholder="نص الحديث أو القول"
                  className={`${field} font-amiri text-base`}
                  rows={2}
                  maxLength={QUOTE_LIMITS.text}
                  value={row.text}
                  onChange={(e) => change(() => setRows((list) => list.map((r) => (r.key === row.key ? { ...r, text: e.target.value } : r))))}
                />
                <input
                  aria-label={`مصدر الحديث ${i + 1}`}
                  placeholder="المصدر (مثل: رواه البخاري)"
                  className={field}
                  maxLength={QUOTE_LIMITS.source}
                  value={row.source}
                  onChange={(e) => change(() => setRows((list) => list.map((r) => (r.key === row.key ? { ...r, source: e.target.value } : r))))}
                />
              </div>
              <div className="flex items-center gap-1 justify-end">
                <button type="button" className={iconButton} aria-label="نقل لأعلى" title="نقل لأعلى" disabled={i === 0} onClick={() => change(() => setRows((list) => moveItem(list, i, -1)))}>
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" className={iconButton} aria-label="نقل لأسفل" title="نقل لأسفل" disabled={i === rows.length - 1} onClick={() => change(() => setRows((list) => moveItem(list, i, 1)))}>
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button type="button" className={`${iconButton} hover:text-red-600 dark:hover:text-red-400`} aria-label="حذف" title="حذف" onClick={() => change(() => setRows((list) => list.filter((r) => r.key !== row.key)))}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 p-3 shadow-lg backdrop-blur">
        <button type="button" onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </button>
        {dirty && !saving && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">فيه تغييرات لم تُحفظ بعد</span>}
        {message && (
          <span role={message.type === 'error' ? 'alert' : 'status'} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${message.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
};
