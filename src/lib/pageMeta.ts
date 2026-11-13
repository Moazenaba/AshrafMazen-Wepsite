// The title and description of a page, for the pages made after the last deploy (a video or playlist found on the
// channel since): the prerendered pages already carry theirs, and a search engine that runs the page reads these.
import { useEffect } from 'react';

export const SITE_NAME = 'الشيخ أشرف مازن';

// The page title the prerender gives a video or a playlist: its own name, with the site's name unless it has it
export const namedTitle = (text: string) => (/مازن/.test(text) ? text : `${text} - ${SITE_NAME}`);

function setMeta(selector: string, create: () => HTMLElement, value: string) {
  let tag = document.head.querySelector<HTMLElement>(selector);
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

const meta = (attr: 'name' | 'property', key: string) => () => Object.assign(document.createElement('meta'), { [attr]: key }) as HTMLElement;

export function usePageMeta(page: { title: string; description: string } | null): void {
  const title = page?.title;
  const description = page?.description;
  useEffect(() => {
    if (!title || !description) return;
    document.title = title;
    setMeta('meta[name="description"]', meta('name', 'description'), description);
    setMeta('meta[property="og:title"]', meta('property', 'og:title'), title);
    setMeta('meta[property="og:description"]', meta('property', 'og:description'), description);
  }, [title, description]);
}
