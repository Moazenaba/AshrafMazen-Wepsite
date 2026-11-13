// Anonymous statistics: who is here now, and one page view per page opened (never for the admin area).
import { useEffect } from 'react';
import { startPresence, trackPageView } from '../services/analytics';

export function usePageAnalytics(pathname: string, isAdmin: boolean): void {
  useEffect(() => {
    if (!isAdmin) return whenIdle(startPresence);
  }, [isAdmin]);
  useEffect(() => {
    if (!isAdmin) return whenIdle(trackPageView);
  }, [pathname, isAdmin]);
}

// Statistics never compete with the page's own first requests and render: they wait until the browser is idle
function whenIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 2000);
  return () => window.clearTimeout(id);
}
