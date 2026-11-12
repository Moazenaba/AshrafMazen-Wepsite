// One playlist in the admin's "فيديوهات القناة" tab: its title, shown or hidden, its place in the menu, and its
// videos (VideoRow): order them, move one to another playlist, take one out of this playlist or off the whole site,
// add more by link or upload, attach files for listening and download.
import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Plus } from 'lucide-react';
import { orderPlaylists, type SitePlaylist } from '../../../lib/libraryOverrides';
import type { YoutubeOverrides } from '../../../services/data/youtube';
import { getYouTubeId } from '../../../lib/youtube';
import { FileUploadButton } from '../FileUploadButton';
import { addToPlaylist, newUploadId, titleFromFile } from './overridesDraft';
import { VideoRow } from './VideoRow';
import { inputClass } from './styles';

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
  // Every playlist (for "انقل إلى قائمة")
  playlists: { id: string; title: string }[];
  fetchTitle: (videoId: string) => Promise<string | null>;
  onMessage: (m: { type: 'ok' | 'error'; text: string }) => void;
}

export const PlaylistCard: React.FC<Props> = ({ playlist, draft, setDraft, query, expanded, onToggleOpen, onMove, first, last, playlists, fetchTitle, onMessage }) => {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const hidden = draft.hiddenPlaylists.includes(playlist.id);
  const additions = draft.playlistAdditions[playlist.id] ?? [];
  const addedIds = new Set(additions.map((v) => v.id));
  const all = orderPlaylists([...additions, ...playlist.videos.filter((v) => !addedIds.has(v.id))], draft.videoOrder[playlist.id]);
  const orderedIds = all.map((v) => v.id);
  const targets = playlists.filter((p) => p.id !== playlist.id);
  const videos = query ? all.filter((v) => (draft.videoTitles[v.id] || v.title).includes(query) || v.title.includes(query)) : all;
  if (query && videos.length === 0) return null;

  const toggleHidden = () =>
    setDraft((d) => ({ ...d, hiddenPlaylists: hidden ? d.hiddenPlaylists.filter((x) => x !== playlist.id) : [...d.hiddenPlaylists, playlist.id] }));
  const renamePlaylist = (value: string) =>
    setDraft((d) => {
      const next = { ...d.playlistTitles };
      if (value.trim()) next[playlist.id] = value;
      else delete next[playlist.id];
      return { ...d, playlistTitles: next };
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

  const iconBtn = 'w-11 h-11 shrink-0 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30';

  return (
    <li className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
      {/* Phones: the title takes the whole first line, the buttons the next; wide screens: one line */}
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button type="button" onClick={onToggleOpen} aria-expanded={expanded} aria-label={`عرض فيديوهات ${playlist.title}`} className={iconBtn}>
            <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor={`pl-${playlist.id}`} className="sr-only">عنوان القائمة على الموقع</label>
            <input id={`pl-${playlist.id}`} value={draft.playlistTitles[playlist.id] ?? ''} onChange={(e) => renamePlaylist(e.target.value)} placeholder={playlist.title} className={`${inputClass} w-full font-semibold ${hidden ? 'opacity-60' : ''}`} />
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {new Intl.NumberFormat('ar-EG').format(all.length)} فيديو · الأصل: {playlist.title}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button type="button" aria-label="تقديم القائمة" disabled={first} onClick={() => onMove(-1)} className={iconBtn}>
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="تأخير القائمة" disabled={last} onClick={() => onMove(1)} className={iconBtn}>
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={toggleHidden} aria-pressed={hidden} className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold ${hidden ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'}`}>
            {hidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            {hidden ? 'مخفية' : 'ظاهرة'}
          </button>
        </div>
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
          <ul className="space-y-1 max-h-[36rem] overflow-y-auto">
            {videos.map((video) => (
              <VideoRow
                key={video.id}
                video={video}
                playlistId={playlist.id}
                orderedIds={orderedIds}
                index={orderedIds.indexOf(video.id)}
                targets={targets}
                draft={draft}
                setDraft={setDraft}
                open={actionsOpen === video.id}
                onToggle={() => setActionsOpen(actionsOpen === video.id ? null : video.id)}
                onMessage={onMessage}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};
