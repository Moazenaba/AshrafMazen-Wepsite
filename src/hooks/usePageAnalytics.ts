// Anonymous statistics: who is here now, and one page view per page opened (never for the admin area).
import { useEffect } from 'react';
import { startPresence, trackPageView } from '../services/analytics';

export function usePageAnalytics(pathname: string, isAdmin: boolean): void {
  useEffect(() => {
    if (!isAdmin) startPresence();
  }, [isAdmin]);
  useEffect(() => {
    if (!isAdmin) trackPageView();
  }, [pathname, isAdmin]);
}
