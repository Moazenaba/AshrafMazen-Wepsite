// The home page's side menu ("القائمة"): every item in one list, to order with the arrows and to show or hide.
// The items come from the site itself (every lesson, reels, the categories with lessons, the channel's playlists),
// so a new category or playlist appears here by itself, after the ones already placed.
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, RotateCcw, Save } from 'lucide-react';
import { getSiteContent, saveSideMenu } from '../../../services/data/siteContent';
import { getCategoriesWithPortalData } from '../../../services/data/portal';
import { arrangeMenu, EMPTY_MENU, moveMenuItem, sideMenuItems, toggleMenuItem, type SideMenuConfig } from '../../../services/data/sideMenuRules';
import { useYoutubeLibrary } from '../../../lib/youtubeLibrary';
import { JUMUAH_PLAYLIST_ID } from '../../../pages/home/sermons';

type Category = { id: string; name: string; slug: string };

export const SideMenuSettings: React.FC = () => {
  const [config, setConfig] = useState<SideMenuConfig>(EMPTY_MENU);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const library = useYoutubeLibrary();

  useEffect(() => {
    getSiteContent(true).then((c) => setConfig(c.menu));
    getCategoriesWithPortalData()
      .then((list) => setCategories(list.filter((c) => c.lessonCount > 0)))
      .catch(() => setCategories([]));
  }, []);

  const items = useMemo(
    () => arrangeMenu(sideMenuItems(categories, library.filter((p) => p.id !== JUMUAH_PLAYLIST_ID)), config, true),
    [categories, library, config]
  );

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setConfig(await saveSideMenu(config));
      setMessage({ type: 'ok', text: 'تم الحفظ، والقائمة الجانبية في الصفحة الرئيسية بالترتيب الجديد.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  const iconBtn = 'press w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 disabled:opacity-30';

  return (
    <section className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-amber-400" />
          <span>القائمة الجانبية في الصفحة الرئيسية</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          رتّب العناصر بالأسهم، واضغط على العين لإخفاء عنصر من القائمة (يبقى موجودًا في الموقع). الأقسام والقوائم الجديدة تظهر هنا تلقائيًا.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          جارٍ تحميل عناصر القائمة…
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, i) => {
            const hidden = config.hidden.includes(item.key);
            return (
              <li key={item.key} className={`flex items-center gap-2 p-2 rounded-xl border border-stone-200 dark:border-stone-800 ${hidden ? 'bg-stone-100 dark:bg-stone-800/60' : 'bg-stone-50 dark:bg-stone-900'}`}>
                <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums text-stone-500">{i + 1}</span>
                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${hidden ? 'text-stone-500 line-through' : 'text-stone-900 dark:text-stone-100'}`}>{item.label}</span>
                <button type="button" aria-label={`تقديم «${item.label}»`} disabled={i === 0} onClick={() => setConfig((c) => moveMenuItem(c, items, i, -1))} className={iconBtn}>
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`تأخير «${item.label}»`} disabled={i === items.length - 1} onClick={() => setConfig((c) => moveMenuItem(c, items, i, 1))} className={iconBtn}>
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-pressed={hidden}
                  aria-label={hidden ? `إظهار «${item.label}»` : `إخفاء «${item.label}»`}
                  onClick={() => setConfig((c) => toggleMenuItem(c, item.key))}
                  className={`${iconBtn} ${hidden ? 'text-stone-500' : 'text-emerald-800 dark:text-emerald-300'}`}
                >
                  {hidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm font-semibold ${message.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-emerald-800 dark:text-emerald-300'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={saving} className="press inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
          حفظ
        </button>
        <button type="button" onClick={() => setConfig(EMPTY_MENU)} className="press inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm font-semibold">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          الترتيب الأصلي
        </button>
      </div>
    </section>
  );
};
