import { useEffect } from 'react';

// The site's one public address. Every page names its own address on it as canonical, so search engines index
// each lesson as itself (not as a copy of the home page) and never the duplicate Vercel addresses.
export const SITE_URL = 'https://ashrafmazen.com';

export function canonicalFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  return `${SITE_URL}${path === '/' ? '/' : path}`;
}

// Pages that should never show in search results: search results, the visitor's own bookmarks, the request form.
// Their links are still followed. Everything else keeps the shell's index directive.
export const INDEX = 'index, follow, max-image-preview:large';
const NOINDEX_PATHS = ['/search', '/bookmarks', '/contribute', '/admin', '/dev'];
export function robotsFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  return NOINDEX_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ? 'noindex, follow' : INDEX;
}

function setHeadTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let tag = document.head.querySelector<HTMLElement>(selector);
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

// Keeps <link rel="canonical"> and og:url on the page being shown (the prerendered pages already have them;
// this covers pages added after the last deploy and moves within the app)
export function useCanonical(pathname: string, isAdmin: boolean): void {
  useEffect(() => {
    if (isAdmin) return;
    const href = canonicalFor(pathname);
    setHeadTag(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      'href',
      href
    );
    setHeadTag(
      'meta[property="og:url"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:url');
        return meta;
      },
      'content',
      href
    );
    setHeadTag(
      'meta[name="robots"]',
      () => Object.assign(document.createElement('meta'), { name: 'robots' }),
      'content',
      robotsFor(pathname)
    );
  }, [pathname, isAdmin]);
}
