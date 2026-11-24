import { useEffect } from 'react';

// The site's one public address. Every page names its own address on it as canonical, so search engines index
// each lesson as itself (not as a copy of the home page) and never the duplicate Vercel addresses.
export const SITE_URL = 'https://ashrafmazen.com';

export function canonicalFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  return `${SITE_URL}${path === '/' ? '/' : path}`;
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
  }, [pathname, isAdmin]);
}
