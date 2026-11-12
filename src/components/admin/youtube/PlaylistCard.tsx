// One playlist in the admin's "فيديوهات القناة" tab: its title, shown or hidden, its place in the menu,
// and its videos: remove any (a removed one never comes back from YouTube), add more, attach files for listening and download.
import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Music, Plus, Video, X } from 'lucide-react';
import type { SitePlaylist, SiteVideo } from '../../../lib/libraryOverrides';
import type { YoutubeOverrides } from '../../../services/data/youtube';
import { getYouTubeId } from '../../../lib/youtube';
import { FileUploadButton } from '../FileUploadButton';
import { addToPlaylist, newUploadId, removeFromPlaylist, setMediaFile, titleFromFile } from './overridesDraft';

export const inputClass =
  'h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';

interface Props {
  playlist: SitePlaylist;
  draft: YoutubeOverrides;
  setDraft: React.Dispatch<React.SetStateAction<YoutubeOverrides>>;
  query: string;
  expanded: boolean;
  onToggleOpen: () => void;
  onMove: (step: -1 | 1) => void;
  first: boolean;
  last: boolean;
  fetchTitle: (videoId: string) => Promise<string | null>;
  onMessage: (m: { type: 'ok' | 'error'; text: string }) => void;
}

const FilesRow: React.FC<{ video: SiteVideo; draft: YoutubeOverrides; setDraft: Props['setDraft']; onMessage: Props['onMessage'] }> = ({ video, draft, setDraft, onMessage }) => {
  const files = draft.mediaFiles[video.id] ?? {};
  const err = (text: string) => onMessage({ type: 'error', text });
  return (
    <div className="flex flex-wrap items-center gap-2 ps-2 pb-2 text-xs text-stone-600 dark:text-stone-400">
      <span>ملفات الاستماع والتحميل:</span>
      {(['audio', 'video'] as const).map((kind) => (
        <span key={kind} className="inline-flex items-center gap-1">
          {files[kind] ? (
            <span className="inline-flex items-center gap-1 h-8 ps-3 pe-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200">
              {kind === 'audio' ? 'صوت ✓' : 'فيديو ✓'}
              <button type="button" aria-label="إزالة الملف" onClick={() => setDraft((d) => setMediaFile(d, video.id, kind, null))} className="w-6 h-6 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900">×</button>
            </span>
          ) : (
            <FileUploadButton kind={kind} label={kind === 'audio' ? 'رفع صوت' : 'رفع فيديو'} className="h-8 px-3 text-xs" onError={err} onUploaded={(url) => setDraft((d) => setMediaFile(d, video.id, kind, url))} />
          )}
        </span>
      ))}
    </div>
  );
};

export const PlaylistCard: React.FC<Props> = ({ playlist, draft, setDraft, query, expanded, onToggleOpen, onMove, first, last, fetchTitle, onMessage }) => {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [filesOpen, setFilesOpen] = useState<string | null>(null);
  const hidden = draft.hiddenPlaylists.includes(playlist.id);
  const additions = draft.playlistAdditions[playlist.id] ?? [];
  const addedIds = new Set(additions.map((v) => v.id));
  const all = [...additions, ...playlist.videos.filter((v) => !addedIds.has(v.id))];
  const videos = query ? all.filter((v) => (draft.videoTitles[v.id] || v.title).includes(query) || v.title.includes(query)) : all;
  if (query && videos.length === 0) return null;

  const toggleHidden = (list: 'hiddenPlaylists' | 'hiddenVideos', id: string) =>
    setDraft((d) => ({ ...d, [list]: d[list].includes(id) ? d[list].filter((x) => x !== id) : [...d[list], id] }));
  const rename = (list: 'videoTitles' | 'playlistTitles', id: string, value: string) =>
    setDraft((d) => {
      const next = { ...d[list] };
      if (value.trim()) next[id] = value;
      else delete next[id];
      return { ...d, [list]: next };
    });

  const addLink = async () => {
    const id = getYouTubeId(link.trim());
    if (!id) return onMessage({ type: 'error', text: 'الصق رابط فيديو من يوتيوب لإضافته لهذه القائمة.' });
    if (all.some((v) => v.id === id)) return onMessage({ type: 'error', text: 'هذا الفيديو موجود في القائمة بالفعل.' });
    setBusy(true);
    const title = (await fetchTitle(id)) || 'فيديو';
    setBusy(false);
    setDraft((d) => addToPlaylist(d, playlist.id, { id, title }));
    setLink('');
    onMessage({ type: 'ok', text: `أُضيف «${title}» لقائمة «${playlist.title}». اضغط «حفظ التغييرات».` });
  };

  const addUpload = (kind: 'video' | 'audio') => (url: string, file: File) => {
    const title = titleFromFile(file.name) || 'ملف مرفوع';
    setDraft((d) => addToPlaylist(d, playlist.id, { id: newUploadId(), title, src: url, kind }));
    onMessage({ type: 'ok', text: `رُفع «${title}» وأُضيف للقائمة. عدّل عنوانه إن شئت ثم اضغط «حفظ التغييرات».` });
  };

  const iconBtn = 'w-10 h-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30';

  return (
    <li className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
      <div className="p-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onToggleOpen} aria-expanded={expanded} aria-label={`عرض فيديوهات ${playlist.title}`} className={iconBtn}>
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={`pl-${playlist.id}`} className="sr-only">عنوان القائمة على الموقع</label>
          <input id={`pl-${playlist.id}`} value={draft.playlistTitles[playlist.id] ?? ''} onChange={(e) => rename('playlistTitles', playlist.id, e.target.value)} placeholder={playlist.title} className={`${inputClass} w-full font-semibold ${hidden ? 'opacity-60' : ''}`} />
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {new Intl.NumberFormat('ar-EG').format(all.length)} فيديو · الأصل: {playlist.title}
          </p>
        </div>
        <button type="button" aria-label="تقديم القائمة" disabled={first} onClick={() => onMove(-1)} className={iconBtn}>
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label="تأخير القائمة" disabled={last} onClick={() => onMove(1)} className={iconBtn}>
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => toggleHidden('hiddenPlaylists', playlist.id)} aria-pressed={hidden} className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold ${hidden ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'}`}>
          {hidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          {hidden ? 'مخفية' : 'ظاهرة'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 dark:border-stone-800 p-2 sm:p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 p-1.5">
            <input aria-label={`رابط فيديو لإضافته إلى ${playlist.title}`} dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/..." className={`${inputClass} flex-1 min-w-48`} />
            <button type="button" onClick={addLink} disabled={busy} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold disabled:opacity-60">
              <Plus className="w-4 h-4" aria-hidden="true" />
              إضافة فيديو
            </button>
            <FileUploadButton kind="video" label="رفع فيديو" onUploaded={addUpload('video')} onError={(text) => onMessage({ type: 'error', text })} />
            <FileUploadButton kind="audio" label="رفع صوتية" onUploaded={addUpload('audio')} onError={(text) => onMessage({ type: 'error', text })} />
          </div>
          <ul className="space-y-1 max-h-[32rem] overflow-y-auto">
            {videos.map((video) => {
              const added = addedIds.has(video.id);
              const videoHidden = draft.hiddenVideos.includes(video.id);
              const hasFiles = !!draft.mediaFiles[video.id];
              return (
                <li key={video.id} className="rounded-lg">
                  <div className="flex items-center gap-2 p-1.5">
                    {video.src && (video.kind === 'audio' ? <Music className="w-4 h-4 shrink-0 text-amber-700" aria-label="صوتية مرفوعة" /> : <Video className="w-4 h-4 shrink-0 text-amber-700" aria-label="فيديو مرفوع" />)}
                    <label htmlFor={`v-${video.id}`} className="sr-only">عنوان الفيديو على الموقع</label>
                    <input id={`v-${video.id}`} value={draft.videoTitles[video.id] ?? ''} onChange={(e) => rename('videoTitles', video.id, e.target.value)} placeholder={video.title} className={`${inputClass} min-w-0 flex-1 ${videoHidden ? 'opacity-60 line-through' : ''}`} />
                    {!video.src && (
                      <button type="button" onClick={() => setFilesOpen(filesOpen === video.id ? null : video.id)} aria-expanded={filesOpen === video.id} title="ملفات الاستماع والتحميل" aria-label={`ملفات «${video.title}»`} className={`${iconBtn} ${hasFiles ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-500'}`}>
                        <Music className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    {added ? (
                      <button type="button" onClick={() => setDraft((d) => removeFromPlaylist(d, playlist.id, video.id))} aria-label={`إزالة «${video.title}» من القائمة`} title="إزالة" className={`${iconBtn} text-red-700 dark:text-red-400`}>
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => toggleHidden('hiddenVideos', video.id)} aria-pressed={videoHidden} aria-label={videoHidden ? `إرجاع «${video.title}»` : `حذف «${video.title}» من الموقع`} title={videoHidden ? 'إرجاع' : 'حذف من الموقع (لن يعود تلقائياً)'} className={`${iconBtn} ${videoHidden ? 'bg-stone-200 dark:bg-stone-700' : 'text-emerald-800 dark:text-emerald-300'}`}>
                        {videoHidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                      </button>
                    )}
                  </div>
                  {filesOpen === video.id && <FilesRow video={video} draft={draft} setDraft={setDraft} onMessage={onMessage} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};
