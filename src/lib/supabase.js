import { createClient } from '@supabase/supabase-js';

/**
 * Normalizes Supabase URL to project root:
 * Removes trailing slash and '/rest/v1' suffix if present.
 */
function normalizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return '';
  let clean = String(rawUrl).trim();
  if (clean.endsWith('/rest/v1')) {
    clean = clean.slice(0, -'/rest/v1'.length);
  }
  if (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = rawKey ? String(rawKey).trim() : '';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. Please set them in your environment.'
  );
}

// In development, direct calls to *.supabase.co can be blocked (iframe previews, ad-blockers), so a failed call is
// retried through the dev server's same-origin /supabase-proxy (vite.config.ts). That proxy exists only in
// development: on the deployed site /supabase-proxy is answered by index.html, so there the fallback stays off.
const PROXY_AVAILABLE = Boolean(import.meta.env.DEV);
let useProxyFallback = false;

/**
 * Resilient fetch function for Supabase client
 */
async function resilientFetch(input, init) {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input && typeof input.url === 'string'
      ? input.url
      : '';

  // If already flagged to use proxy fallback for Supabase endpoints
  if (PROXY_AVAILABLE && useProxyFallback && supabaseUrl && urlStr.startsWith(supabaseUrl)) {
    const proxyUrl = urlStr.replace(supabaseUrl, '/supabase-proxy');
    return fetch(proxyUrl, init);
  }

  // Clone Request if needed so body is not consumed on error
  let requestClone = null;
  if (input instanceof Request) {
    try {
      requestClone = input.clone();
    } catch {}
  }

  try {
    return await fetch(input, init);
  } catch (err) {
    // If direct fetch throws TypeError: Failed to fetch (network error, CORS, or iframe block)
    if (PROXY_AVAILABLE && supabaseUrl && urlStr.startsWith(supabaseUrl)) {
      useProxyFallback = true;
      const proxyUrl = urlStr.replace(supabaseUrl, '/supabase-proxy');
      console.warn(
        `[Supabase Client] Direct fetch failed. Routing via same-origin proxy: ${proxyUrl}`
      );
      if (requestClone) {
        return fetch(proxyUrl, {
          method: requestClone.method,
          headers: requestClone.headers,
          body: requestClone.body,
          ...init,
        });
      }
      return fetch(proxyUrl, init);
    }
    throw err;
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: resilientFetch,
    },
  }
);
