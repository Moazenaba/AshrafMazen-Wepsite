import { useEffect, useState } from 'react';
import { useSiteContent } from './useSiteContent';
import { readLiveStream } from '../services/data/siteContent';
import { liveView, type AutoLive, type LiveStream, type LiveView } from '../services/data/liveStreamRules';

const FIRST_CHECK_MS = 1500;
// Every 3 minutes while the tab is in front (each check is a request in the logs): a broadcast shows within a few minutes
const REFRESH_MS = 180_000;
const SHARE_MS = 20_000;

// Is the Sheikh's own channel live on YouTube right now? One request shared by everything on the page that asks
// (the banner and the /live page); a failed answer counts as "not live" and is asked again next time.
let sharedAuto: { at: number; result: Promise<AutoLive | null> } | null = null;
function checkAutoLive(): Promise<AutoLive | null> {
  if (sharedAuto && Date.now() - sharedAuto.at < SHARE_MS) return sharedAuto.result;
  const result = fetch('/api/live')
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { live?: boolean; videoId?: string; title?: string } | null) =>
      data?.live && data.videoId ? { videoId: data.videoId, title: data.title ?? '' } : null
    )
    .catch(() => null);
  sharedAuto = { at: Date.now(), result };
  return result;
}

// The broadcasts to show now: the Sheikh's YouTube live (found by /api/live, nothing to switch on) and the Telegram
// one the admin switched on. Nothing shows until /api/live has answered, and both are asked again every 3 minutes and
// whenever the tab comes back to the front, so a broadcast that starts or ends shows without the visitor reloading.
// `quick` asks at once (the /live page); the banner on every page waits a moment so it never competes with the first paint.
export function useLiveStream(quick = false): { view: LiveView; loaded: boolean } {
  const { content } = useSiteContent();
  const [manual, setManual] = useState<LiveStream | null>(null);
  const [auto, setAuto] = useState<{ answered: boolean; live: AutoLive | null }>({ answered: false, live: null });

  useEffect(() => {
    let alive = true;
    const check = () => {
      checkAutoLive().then((live) => {
        if (alive) setAuto({ answered: true, live });
      });
      readLiveStream()
        .then((fresh) => {
          if (alive) setManual(fresh);
        })
        .catch(() => {
          // keeps what is shown; the next check tries again
        });
    };
    const visibleCheck = () => {
      if (document.visibilityState === 'visible') check();
    };
    const first = window.setTimeout(check, quick ? 0 : FIRST_CHECK_MS);
    const timer = window.setInterval(visibleCheck, REFRESH_MS);
    document.addEventListener('visibilitychange', visibleCheck);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibleCheck);
    };
  }, [quick]);

  return { view: liveView(auto.live, manual ?? content.live), loaded: auto.answered };
}
