// The site was updated while this tab was open: its old page files are gone, so load the new version once.
import { useEffect } from 'react';
import { reloadOnceForNewVersion } from '../components/ErrorBoundary';

export function useVersionReload(): void {
  useEffect(() => {
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      reloadOnceForNewVersion();
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);
}
