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

// In browser and iframe environments, direct cross-origin calls to *.supabase.co
// can be blocked by browser iframe sandboxing, strict CSP, ad-blockers, or regional ISP filtering.
// We maintain a resilient fetch that automatically falls back to our same-origin /supabase-proxy.
let useProxyFallback = false;

// Quick non-blocking probe to test if direct connection works in this client
if (typeof window !== 'undefined' && supabaseUrl) {
  fetch(`${supabaseUrl}/rest/v1/`, { method: 'HEAD', mode: 'no-cors' }).catch(() => {
    useProxyFallback = true;
  });
}

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
  if (useProxyFallback && supabaseUrl && urlStr.startsWith(supabaseUrl)) {
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
    if (supabaseUrl && urlStr.startsWith(supabaseUrl)) {
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
