import { useEffect, useState } from 'react';
import { getSiteContent } from '../services/data/siteContent';
import { DEFAULT_CONTENT, type SiteContent } from '../services/data/siteContentRules';

// The admin-edited texts of the public pages. Until they arrive the built-in texts are used, except the
// sayings strip, which waits (so a strip the admin removed never flashes on screen first).
export function useSiteContent(): { content: SiteContent; loaded: boolean } {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getSiteContent()
      .then((data) => {
        if (alive) setContent(data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { content, loaded };
}
