// One video in a playlist of the admin's "فيديوهات القناة" tab: its title, and behind "⋯" what can be done with it:
// a step up or down, move to another playlist, take out of this playlist, remove from the whole site, attach files.
// The actions sit on their own line, so they stay easy to tap on a phone.
import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, FolderInput, MoreHorizontal, Music, Undo2, Video, X } from 'lucide-react';
import type { SiteVideo } from '../../../lib/libraryOverrides';
import type { YoutubeOverrides } from '../../../services/data/youtube';
import { FileUploadButton } from '../FileUploadButton';
import { moveToPlaylist, moveVideo, putBackInPlaylist, setMediaFile, takeOutOfPlaylist } from './overridesDraft';
import { inputClass } from './styles';

interface Props {
  video: SiteVideo;
  playlistId: string;
  // The playlist as the admin sees it now (for the up / down steps), and where this video sits in it
  orderedIds: string[];
  index: number;
  // The other playlists it can move to
  targets: { id: string; title: string }[];
  draft: YoutubeOverrides;
  setDraft: React.Dispatch<React.SetStateAction<YoutubeOverrides>>;
  open: boolean;
  onToggle: () => void;
  onMessage: (m: { type: 'ok' | 'error'; text: string }) => void;
}

const action = 'inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-semibold disabled:opacity-30';

export const VideoRow: React.FC<Props> = ({ video, playlistId, orderedIds, index, targets, draft, setDraft, open, onToggle, onMessage }) => {
  const title = draft.videoTitles[video.id] || video.title;
  const hiddenEverywhere = draft.hiddenVideos.includes(video.id);
  const outOfThis = (draft.playlistRemovals[playlistId] ?? []).includes(video.id);
  const files = draft.mediaFiles[video.id] ?? {};
  const rename = (value: string) =>
    setDraft((d) => {
      const next = { ...d.videoTitles };
      if (value.trim()) next[video.id] = value;
      else delete next[video.id];
      return { ...d, videoTitles: next };
    });
  const toggleEverywhere = () =>
    setDraft((d) => ({ ...d, hiddenVideos: hiddenEverywhere ? d.hiddenVideos.filter((x) => x !== video.id) : [...d.hiddenVideos, video.id] }));

  return (
    <li className={`rounded-xl ${open ? 'bg-stone-50 dark:bg-stone-800/60' : ''}`}>
      <div className="flex items-center gap-2 p-1.5">
        {video.src && (video.kind === 'audio' ? <Music className="w-4 h-4 shrink-0 text-amber-700" aria-label="صوتية مرفوعة" /> : <Video className="w-4 h-4 shrink-0 text-amber-700" aria-label="فيديو مرفوع" />)}
        <label htmlFor={`v-${playlistId}-${video.id}`} className="sr-only">عنوان الفيديو على الموقع</label>
        <input
          id={`v-${playlistId}-${video.id}`}
          value={draft.videoTitles[video.id] ?? ''}
          onChange={(e) => rename(e.target.value)}
          placeholder={video.title}
          className={`${inputClass} min-w-0 flex-1 ${hiddenEverywhere || outOfThis ? 'opacity-60 line-through' : ''}`}
        />
        {(hiddenEverywhere || outOfThis) && <span className="shrink-0 text-xs font-semibold text-stone-500">{hiddenEverywhere ? 'محذوف' : 'خارج القائمة'}</span>}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`إجراءات «${title}»`}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="px-2 pb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={index === 0} onClick={() => setDraft((d) => moveVideo(d, playlistId, orderedIds, index, -1))} className={`${action} bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700`}>
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
              لأعلى
            </button>
            <button type="button" disabled={index === orderedIds.length - 1} onClick={() => setDraft((d) => moveVideo(d, playlistId, orderedIds, index, 1))} className={`${action} bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700`}>
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
              لأسفل
            </button>
            {targets.length > 0 && (
              <label className={`${action} bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 cursor-pointer`}>
                <FolderInput className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">انقل إلى قائمة</span>
                <select
                  value=""
                  onChange={(e) => {
                    const to = targets.find((t) => t.id === e.target.value);
                    if (!to) return;
                    setDraft((d) => moveToPlaylist(d, playlistId, to.id, { ...video, title }));
                    onMessage({ type: 'ok', text: `نُقل «${title}» إلى «${to.title}». اضغط «حفظ التغييرات».` });
                  }}
                  className="bg-transparent text-sm font-semibold max-w-44 focus:outline-none"
                >
                  <option value="">انقل إلى قائمة…</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {outOfThis ? (
              <button type="button" onClick={() => setDraft((d) => putBackInPlaylist(d, playlistId, video.id))} className={`${action} bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300`}>
                <Undo2 className="w-4 h-4" aria-hidden="true" />
                رجّعه للقائمة
              </button>
            ) : (
              <button type="button" onClick={() => setDraft((d) => takeOutOfPlaylist(d, playlistId, video.id))} className={`${action} bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200`}>
                <X className="w-4 h-4" aria-hidden="true" />
                شيله من القائمة دي
              </button>
            )}
            <button type="button" onClick={toggleEverywhere} aria-pressed={hiddenEverywhere} className={`${action} ${hiddenEverywhere ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300'}`}>
              {hiddenEverywhere ? <Eye className="w-4 h-4" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
              {hiddenEverywhere ? 'رجّعه للموقع' : 'احذفه من الموقع كله'}
            </button>
          </div>

          {!video.src && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              <span>ملفات الاستماع والتحميل:</span>
              {(['audio', 'video'] as const).map((kind) =>
                files[kind] ? (
                  <span key={kind} className="inline-flex items-center gap-1 h-9 ps-3 pe-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200">
                    {kind === 'audio' ? 'صوت ✓' : 'فيديو ✓'}
                    <button type="button" aria-label="إزالة الملف" onClick={() => setDraft((d) => setMediaFile(d, video.id, kind, null))} className="w-7 h-7 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900">
                      ×
                    </button>
                  </span>
                ) : (
                  <FileUploadButton key={kind} kind={kind} label={kind === 'audio' ? 'رفع صوت' : 'رفع فيديو'} className="h-9 px-3 text-xs" onError={(text) => onMessage({ type: 'error', text })} onUploaded={(url) => setDraft((d) => setMediaFile(d, video.id, kind, url))} />
                )
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
};
