import { useEffect, useState } from 'react';
import { getSiteContent } from '../services/data/siteContent';
import { DEFAULT_CONTENT, type SiteContent } from '../services/data/siteContentRules';
import { storedSiteBundle } from '../services/data/siteBundle';
import { bundleContent } from '../services/data/siteBundleRules';

// The admin-edited texts of the public pages. The copy saved on the last visit is used at once; otherwise the
// built-in texts are used until they arrive, except the sayings strip, which waits (so a strip the admin removed
// never flashes on screen first).
export function useSiteContent(): { content: SiteContent; loaded: boolean } {
  const [state, setState] = useState(() => {
    const saved = storedSiteBundle();
    return saved ? { content: bundleContent(saved), loaded: true } : { content: DEFAULT_CONTENT, loaded: false };
  });

  useEffect(() => {
    let alive = true;
    getSiteContent()
      .then((content) => {
        if (alive) setState({ content, loaded: true });
      })
      .catch(() => {
        if (alive) setState((prev) => ({ ...prev, loaded: true }));
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
