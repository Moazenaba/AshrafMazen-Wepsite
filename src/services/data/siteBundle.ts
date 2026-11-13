// The public pages' first-load data in one request (/api/site, preloaded by index.html and kept by the CDN),
// with the last copy kept in this browser so a returning visitor's home page draws at once, before any request.
// An admin (a saved session in this browser) never uses it: admins read live rows, so their edits show at once.
import { hasStoredSession } from '../../lib/supabase';
import { isSiteBundle, type SiteBundle } from './siteBundleRules';

const STORAGE_KEY = 'site_bundle_v1';
const ENDPOINT = '/api/site';

let current: SiteBundle | null | undefined;
let request: Promise<SiteBundle | null> | null = null;

// The copy saved on the last visit, or null; read once
export function storedSiteBundle(): SiteBundle | null {
  if (current !== undefined) return current;
  current = null;
  if (hasStoredSession()) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (isSiteBundle(parsed)) current = parsed;
  } catch {}
  // A first visit: the copy the build wrote into the page (scripts/prerender.mjs), replaced by the fresh answer a moment later
  if (!current) {
    try {
      const parsed = JSON.parse(document.getElementById('site-seed')?.textContent || 'null');
      if (isSiteBundle(parsed)) current = parsed;
    } catch {}
  }
  return current;
}

// The fresh copy, asked once per page load (later callers share the same answer); null when it cannot be had
export function loadSiteBundle(): Promise<SiteBundle | null> {
  if (hasStoredSession()) return Promise.resolve(null);
  if (!request) {
    request = fetch(ENDPOINT)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!isSiteBundle(data)) return null;
        current = data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {}
        return data;
      })
      .catch(() => null);
  }
  return request;
}
