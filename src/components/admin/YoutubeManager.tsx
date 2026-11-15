import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { readYoutubeOverrides, saveYoutubeOverridesIfUnchanged, type YoutubeOverrides } from '../../services/dataService';
import { overridesChanged, useRawYoutubeLibrary } from '../../lib/youtubeLibrary';
import { getYouTubeId } from '../../lib/youtube';
import { orderPlaylists } from '../../lib/libraryOverrides';
import { EMPTY_OVERRIDES } from '../../services/data/youtube';
import { FileUploadButton } from './FileUploadButton';
import { PlaylistCard } from './youtube/PlaylistCard';
import { getCategories } from '../../services/dataService';
import { inputClass } from './youtube/styles';
import { movePlaylist, newUploadId, titleFromFile } from './youtube/overridesDraft';
import { timedFetch } from '../../lib/timedFetch';

const empty: YoutubeOverrides = EMPTY_OVERRIDES;

// A playlist address or just its id: https://www.youtube.com/playlist?list=PL... or PL... (a video id is 11 characters, a playlist's longer)
const playlistIdFrom = (text: string) =>
  text.match(/[?&]list=([A-Za-z0-9_-]{12,60})/)?.[1] || (/^[A-Za-z0-9_-]{12,60}$/.test(text.trim()) ? text.trim() : null);

// The video's title as YouTube shows it, so the admin need not type one
async function youtubeTitle(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
    const response = await timedFetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.title === 'string' && data.title.trim() ? data.title.trim() : null;
  } catch {
    return null;
  }
}

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
  // The stored text the draft started from: a save is refused if someone else saved since (saveYoutubeOverridesIfUnchanged)
  const [baseRaw, setBaseRaw] = useState<string | null>(null);

  useEffect(() => {
    readYoutubeOverrides()
      .then(({ value, raw }) => {
        setSaved(value);
        setDraft(value);
        setBaseRaw(raw);
      })
      .catch((err) => setMessage({ type: 'error', text: err?.message || 'تعذّر تحميل الإعدادات.' }))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  const [adding, setAdding] = useState(false);

  // One box for both: a playlist link (it has list=...) adds the whole playlist, any other video link adds that video alone
  const addPlaylist = async () => {
    const text = newList.trim();
    const id = playlistIdFrom(text);
    if (!id) {
      const videoId = getYouTubeId(text);
      if (!videoId) return setMessage({ type: 'error', text: 'الرابط غير مفهوم. الصق رابط فيديو من يوتيوب، أو رابط قائمة تشغيل (فيه list=...).' });
      if (draft.extraVideos.some((v) => v.id === videoId)) return setMessage({ type: 'error', text: 'هذا الفيديو مضاف بالفعل.' });
      setAdding(true);
      const title = newTitle.trim() || (await youtubeTitle(videoId));
      setAdding(false);
      if (!title) return setMessage({ type: 'error', text: 'تعذّر جلب عنوان الفيديو من يوتيوب. اكتب عنوانه في الخانة الثانية ثم اضغط «إضافة».' });
      setDraft((d) => ({ ...d, extraVideos: [{ id: videoId, title }, ...d.extraVideos] }));
      setMessage({ type: 'ok', text: `أُضيف الفيديو «${title}». اضغط «حفظ التغييرات» ليظهر في الموقع ضمن «مقاطع مختارة».` });
      setNewList('');
      setNewTitle('');
      return;
    }
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
  const removeVideo = (id: string) => setDraft((d) => ({ ...d, extraVideos: d.extraVideos.filter((v) => v.id !== id) }));

  // A file uploaded to the site, shown with the single videos («مقاطع مختارة»)
  const addUpload = (kind: 'video' | 'audio') => (url: string, file: File) => {
    const title = newTitle.trim() || titleFromFile(file.name) || 'ملف مرفوع';
    setDraft((d) => ({ ...d, extraVideos: [{ id: newUploadId(), title, src: url, kind }, ...d.extraVideos] }));
    setNewTitle('');
    setMessage({ type: 'ok', text: `رُفع «${title}». اضغط «حفظ التغييرات» ليظهر في الموقع ضمن «مقاطع مختارة». ولرفع ملف داخل قائمة بعينها افتح القائمة من الأسفل.` });
  };

  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  useEffect(() => {
    getCategories().then((list) => setCategories(list.map((c) => ({ slug: c.slug, name: c.name })))).catch(() => setCategories([]));
  }, []);
  const ordered = useMemo(() => orderPlaylists(library, draft.playlistOrder), [library, draft.playlistOrder]);

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const cleaned: YoutubeOverrides = {
        ...draft,
        videoTitles: Object.fromEntries(Object.entries(draft.videoTitles).map(([k, v]) => [k, v.trim()])),
        playlistTitles: Object.fromEntries(Object.entries(draft.playlistTitles).map(([k, v]) => [k, v.trim()])),
      };
      setBaseRaw(await saveYoutubeOverridesIfUnchanged(cleaned, baseRaw));
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

  const input = inputClass;

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
          <legend className="font-semibold text-stone-900 dark:text-stone-100 text-sm">إضافة فيديو أو قائمة من يوتيوب</legend>
          <div className="flex flex-wrap gap-2">
            <input aria-label="رابط الفيديو أو القائمة" dir="ltr" value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="https://youtu.be/...  or  ...playlist?list=..." className={`${input} w-full sm:w-96`} />
            <input aria-label="العنوان" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="العنوان (اختياري للفيديو)" className={`${input} w-full sm:w-56`} />
            <button type="button" onClick={addPlaylist} disabled={adding} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold disabled:opacity-60">
              {adding && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              إضافة
            </button>
            <FileUploadButton kind="video" label="رفع فيديو للموقع" onUploaded={addUpload('video')} onError={(text) => setMessage({ type: 'error', text })} />
            <FileUploadButton kind="audio" label="رفع صوتية للموقع" onUploaded={addUpload('audio')} onError={(text) => setMessage({ type: 'error', text })} />
          </div>
          <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1 list-disc ps-5">
            <li><b>فيديو واحد:</b> من يوتيوب اضغط «مشاركة» ثم «نسخ»، والصق الرابط هنا. العنوان يُجلب تلقائياً، ويظهر الفيديو في الموقع ضمن «مقاطع مختارة».</li>
            <li><b>قائمة تشغيل كاملة:</b> افتح القائمة نفسها على يوتيوب (من تبويب «قوائم التشغيل» في القناة) ثم «مشاركة» ثم «نسخ»، فيكون في الرابط <span dir="ltr">list=</span>. اكتب لها عنواناً. تظهر بأحدث ١٥ فيديو منها، وتتحدث تلقائياً كل ٦ ساعات.</li>
            <li><b>رفع ملف:</b> فيديو أو صوتية من جهازك تُرفع للموقع نفسه. ولإضافتها داخل قائمة معيّنة افتح القائمة من الأسفل واستخدم أزرار الرفع فيها.</li>
            <li><b>فيديو داخل قائمة:</b> افتح القائمة واضغط «⋯» بجانب الفيديو: «لأعلى / لأسفل» لترتيبه، «انقل إلى قائمة…» لنقله لقائمة أخرى، «شيله من القائمة دي» (يبقى في الموقع وفي قوائمه الأخرى)، أو «احذفه من الموقع كله». المحذوف لا يعود تلقائياً حتى لو بقي على يوتيوب، والجديد بعده يُضاف عادي.</li>
            <li><b>الاستماع والتحميل:</b> من «⋯» أيضاً ترفق للفيديو ملف صوت و/أو فيديو، فيظهر للزائر «استمع فقط» و«تحميل» منه.</li>
            <li>لا يظهر شيء في الموقع قبل الضغط على «حفظ التغييرات».</li>
          </ul>
          {draft.extraVideos.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="الفيديوهات المضافة">
              {draft.extraVideos.map((v) => (
                <li key={v.id} className="inline-flex items-center gap-2 ps-3 pe-1 h-9 max-w-full rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-sm">
                  <span className="truncate">{v.src ? (v.kind === 'audio' ? '♪' : '⬆') : '▶'} {v.title}</span>
                  <button type="button" onClick={() => removeVideo(v.id)} aria-label={`إزالة ${v.title}`} className="w-7 h-7 shrink-0 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900">×</button>
                </li>
              ))}
            </ul>
          )}
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
          {ordered.map((playlist, i) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              draft={draft}
              setDraft={setDraft}
              query={q}
              expanded={open === playlist.id || !!q}
              onToggleOpen={() => setOpen(open === playlist.id ? null : playlist.id)}
              onMove={(step) => setDraft((d) => movePlaylist(d, ordered.map((p) => p.id), i, step))}
              first={i === 0}
              last={i === ordered.length - 1}
              categories={categories}
              playlists={ordered.map((p) => ({ id: p.id, title: draft.playlistTitles[p.id] || p.title }))}
              fetchTitle={youtubeTitle}
              onMessage={setMessage}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
