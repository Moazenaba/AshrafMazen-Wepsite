import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { getYoutubeOverrides, saveYoutubeOverrides, type YoutubeOverrides } from '../../services/dataService';
import { overridesChanged, useRawYoutubeLibrary } from '../../lib/youtubeLibrary';

const empty: YoutubeOverrides = { hiddenPlaylists: [], hiddenVideos: [], videoTitles: {}, playlistTitles: {}, extraPlaylists: [] };

// A playlist address or just its id: https://www.youtube.com/playlist?list=PL... or PL...
const playlistIdFrom = (text: string) =>
  text.match(/[?&]list=([A-Za-z0-9_-]{10,60})/)?.[1] || (/^[A-Za-z0-9_-]{10,60}$/.test(text.trim()) ? text.trim() : null);

// The admin's "فيديوهات القناة" tab. The playlists come from the YouTube channel; the admin cannot change YouTube,
// but decides here what the site shows: hide a playlist or a single video, or show a different title.
export const YoutubeManager: React.FC = () => {
  const library = useRawYoutubeLibrary();
  const [saved, setSaved] = useState<YoutubeOverrides>(empty);
  const [draft, setDraft] = useState<YoutubeOverrides>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [newList, setNewList] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    getYoutubeOverrides()
      .then((value) => {
        setSaved(value);
        setDraft(value);
      })
      .catch((err) => setMessage({ type: 'error', text: err?.message || 'تعذّر تحميل الإعدادات.' }))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  const toggle = (list: 'hiddenPlaylists' | 'hiddenVideos', id: string) =>
    setDraft((d) => ({ ...d, [list]: d[list].includes(id) ? d[list].filter((x) => x !== id) : [...d[list], id] }));

  const addPlaylist = () => {
    const id = playlistIdFrom(newList.trim());
    if (!id) return setMessage({ type: 'error', text: 'الصق رابط القائمة (فيه list=...) أو رقمها فقط.' });
    if (!newTitle.trim()) return setMessage({ type: 'error', text: 'اكتب عنواناً للقائمة.' });
    if (draft.extraPlaylists.some((p) => p.id === id) || library.some((p) => p.id === id)) {
      return setMessage({ type: 'error', text: 'هذه القائمة موجودة بالفعل.' });
    }
    setMessage(null);
    setDraft((d) => ({ ...d, extraPlaylists: [...d.extraPlaylists, { id, title: newTitle.trim() }] }));
    setNewList('');
    setNewTitle('');
  };

  const removeExtra = (id: string) => setDraft((d) => ({ ...d, extraPlaylists: d.extraPlaylists.filter((p) => p.id !== id) }));

  const rename = (list: 'videoTitles' | 'playlistTitles', id: string, value: string) =>
    setDraft((d) => {
      const next = { ...d[list] };
      if (value.trim()) next[id] = value;
      else delete next[id];
      return { ...d, [list]: next };
    });

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const cleaned: YoutubeOverrides = {
        ...draft,
        videoTitles: Object.fromEntries(Object.entries(draft.videoTitles).map(([k, v]) => [k, v.trim()])),
        playlistTitles: Object.fromEntries(Object.entries(draft.playlistTitles).map(([k, v]) => [k, v.trim()])),
      };
      await saveYoutubeOverrides(cleaned);
      setSaved(cleaned);
      setDraft(cleaned);
      overridesChanged(cleaned);
      setMessage({ type: 'ok', text: 'تم الحفظ، والتغييرات ظاهرة الآن في الموقع.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  const q = query.trim();
  const hiddenCount = draft.hiddenPlaylists.length + draft.hiddenVideos.length;

  const input =
    'h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">فيديوهات القناة</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
              تأتي القوائم والفيديوهات من قناة الشيخ على يوتيوب وتتحدث تلقائياً. من هنا تتحكم فيما يظهر في الموقع: أخفِ قائمة أو فيديو
              بعينه، أو اكتب له عنواناً مختلفاً. الإخفاء لا يحذف شيئاً من يوتيوب، ويمكن التراجع عنه في أي وقت.
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            حفظ التغييرات
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="yt-query" className="sr-only">بحث في الفيديوهات</label>
          <input id="yt-query" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بعنوان فيديو..." className={`${input} w-full sm:w-72`} />
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {hiddenCount > 0 ? `${new Intl.NumberFormat('ar-EG').format(hiddenCount)} عنصر مخفي` : 'لا شيء مخفي'}
            {dirty ? ' · تغييرات لم تُحفظ' : ''}
          </span>
        </div>
        <fieldset className="space-y-2 pt-1">
          <legend className="font-semibold text-stone-900 dark:text-stone-100 text-sm">إضافة قائمة جديدة من القناة</legend>
          <div className="flex flex-wrap gap-2">
            <input aria-label="رابط القائمة أو رقمها" dir="ltr" value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="https://www.youtube.com/playlist?list=..." className={`${input} w-full sm:w-80`} />
            <input aria-label="عنوان القائمة" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان القائمة" className={`${input} w-full sm:w-56`} />
            <button type="button" onClick={addPlaylist} className="h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold">إضافة</button>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">بعد «حفظ التغييرات» تظهر القائمة فوراً بأحدث فيديوهاتها من يوتيوب (يوتيوب يعطي آخر ١٥ فيديو فقط لكل قائمة)، ثم تتحدث تلقائياً كل ٦ ساعات.</p>
          {draft.extraPlaylists.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {draft.extraPlaylists.map((p) => (
                <li key={p.id} className="inline-flex items-center gap-2 ps-3 pe-1 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 text-sm">
                  {p.title}
                  {/* Saved, and the library has arrived, yet no videos came back: the link is wrong or the playlist is private */}
                  {saved.extraPlaylists.some((s) => s.id === p.id) && library.length > 0 && !library.some((l) => l.id === p.id) && (
                    <span className="text-xs font-semibold text-red-700 dark:text-red-400">(لم تُجلب فيديوهات: تأكد أن القائمة عامة والرابط صحيح)</span>
                  )}
                  <button type="button" onClick={() => removeExtra(p.id)} aria-label={`إزالة ${p.title}`} className="w-7 h-7 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900">×</button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        {message && (
          <p
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`p-3 rounded-xl text-sm font-semibold ${
              message.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="جارٍ التحميل" />
        </div>
      ) : (
        <ul className="space-y-3">
          {library.map((playlist) => {
            const hidden = draft.hiddenPlaylists.includes(playlist.id);
            const videos = q ? playlist.videos.filter((v) => (draft.videoTitles[v.id] || v.title).includes(q) || v.title.includes(q)) : playlist.videos;
            if (q && videos.length === 0) return null;
            const expanded = open === playlist.id || !!q;
            return (
              <li key={playlist.id} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded && !q ? null : playlist.id)}
                    aria-expanded={expanded}
                    aria-label={`عرض فيديوهات ${playlist.title}`}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <label htmlFor={`pl-${playlist.id}`} className="sr-only">عنوان القائمة على الموقع</label>
                    <input
                      id={`pl-${playlist.id}`}
                      value={draft.playlistTitles[playlist.id] ?? ''}
                      onChange={(e) => rename('playlistTitles', playlist.id, e.target.value)}
                      placeholder={playlist.title}
                      className={`${input} w-full font-semibold ${hidden ? 'opacity-60' : ''}`}
                    />
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {new Intl.NumberFormat('ar-EG').format(playlist.videos.length)} فيديو · الأصل: {playlist.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle('hiddenPlaylists', playlist.id)}
                    aria-pressed={hidden}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold ${
                      hidden
                        ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {hidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    {hidden ? 'مخفية' : 'ظاهرة'}
                  </button>
                </div>

                {expanded && (
                  <ul className="border-t border-stone-100 dark:border-stone-800 p-2 sm:p-3 space-y-1 max-h-[28rem] overflow-y-auto">
                    {videos.map((video) => {
                      const videoHidden = draft.hiddenVideos.includes(video.id);
                      return (
                        <li key={video.id} className="flex items-center gap-2 p-1.5 rounded-lg">
                          <label htmlFor={`v-${video.id}`} className="sr-only">عنوان الفيديو على الموقع</label>
                          <input
                            id={`v-${video.id}`}
                            value={draft.videoTitles[video.id] ?? ''}
                            onChange={(e) => rename('videoTitles', video.id, e.target.value)}
                            placeholder={video.title}
                            className={`${input} min-w-0 flex-1 ${videoHidden ? 'opacity-60' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => toggle('hiddenVideos', video.id)}
                            aria-pressed={videoHidden}
                            aria-label={videoHidden ? `إظهار «${video.title}»` : `إخفاء «${video.title}»`}
                            title={videoHidden ? 'إظهار' : 'إخفاء'}
                            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-lg ${
                              videoHidden ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200' : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                          >
                            {videoHidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
