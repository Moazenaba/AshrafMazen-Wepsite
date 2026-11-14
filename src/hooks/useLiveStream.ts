import { useEffect, useState } from 'react';
import { useSiteContent } from './useSiteContent';
import { readLiveStream } from '../services/data/siteContent';
import type { LiveStream } from '../services/data/liveStreamRules';

const FIRST_CHECK_MS = 1500;
const REFRESH_MS = 90_000;

// The live broadcast the admin switched on or off. The first answer is the (cached) site content, so the page paints at
// once; a moment later the real state is read straight from the database, and again every 90 seconds and whenever the
// tab comes back to the front, so a broadcast that starts or ends shows without the visitor reloading.
export function useLiveStream(): { live: LiveStream; loaded: boolean } {
  const { content, loaded } = useSiteContent();
  const [fresh, setFresh] = useState<LiveStream | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () => {
      readLiveStream()
        .then((live) => {
          if (alive) setFresh(live);
        })
        .catch(() => {
          // keeps what is shown; the next check tries again
        });
    };
    const visibleCheck = () => {
      if (document.visibilityState === 'visible') check();
    };
    const first = window.setTimeout(check, FIRST_CHECK_MS);
    const timer = window.setInterval(visibleCheck, REFRESH_MS);
    document.addEventListener('visibilitychange', visibleCheck);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibleCheck);
    };
  }, []);

  return { live: fresh ?? content.live, loaded: loaded || fresh !== null };
}
