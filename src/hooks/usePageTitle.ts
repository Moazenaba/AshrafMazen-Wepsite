import { useEffect } from 'react';

const SITE_NAME = 'الشيخ أشرف مازن';

// The browser tab's title for a page whose subject loads after it opens (a video, a playlist, a category, a series).
// The sheikh's name is added once; many channel titles already carry it.
export function usePageTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;
    document.title = /مازن/.test(title) ? title : `${title} - ${SITE_NAME}`;
  }, [title]);
}
