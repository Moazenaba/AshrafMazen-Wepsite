// When our download services fail: other download sites for each video, in order (FALLBACK_SITES).
// The first is the big button; the rest are small ones under it. A site that cannot take the video in its address
// gets the video's link copied on the tap, and the window says to paste it there.
import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { FALLBACK_SITES, youtubeUrl, type FallbackSite } from '../lib/mediaDownload';

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const DownloadFallbacks: React.FC<{ videos: { id: string; name: string }[]; many: boolean }> = ({ videos, many }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [first, ...others] = FALLBACK_SITES;

  // The tab opens from the tap itself (a plain link), so the browser never blocks it; the copy runs alongside
  const onOpen = (site: FallbackSite, id: string) => () => {
    if (site.prefilled) return;
    copy(youtubeUrl(id)).then((ok) => setCopied(ok ? `${site.name}:${id}` : null));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-stone-600 dark:text-stone-400">
        حمّله من موقع تحميل: يفتح {first.name} والفيديو جاهز، اضغط «Download» هناك. لو ما اشتغلش جرّب موقع تاني من اللي تحته.
      </p>
      <ul className="space-y-3 max-h-64 overflow-y-auto">
        {videos.map((v) => (
          <li key={v.id} className="space-y-1.5">
            <a href={first.url(v.id)} target="_blank" rel="noopener noreferrer" onClick={onOpen(first, v.id)} className="flex items-center gap-2 min-h-12 px-4 rounded-xl bg-gold text-mushaf-deep font-bold">
              <ExternalLink className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{many ? v.name : `حمّل من ${first.name}`}</span>
            </a>
            <div className="flex flex-wrap gap-2">
              {others.map((site) => (
                <a
                  key={site.name}
                  href={site.url(v.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onOpen(site, v.id)}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm font-semibold"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {site.name}
                </a>
              ))}
            </div>
            {others.some((s) => copied === `${s.name}:${v.id}`) && (
              <p role="status" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                اتنسخ لينك الفيديو، الصقه في خانة الموقع واضغط Start.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
