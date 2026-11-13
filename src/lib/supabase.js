// Two clients: reading and writing rows goes through PostgREST alone (a small library every page can afford);
// the full Supabase client, with sign-in, is downloaded only when an admin session exists or sign-in is asked for.
import { PostgrestClient } from '@supabase/postgrest-js';

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

// Where supabase-js keeps the signed-in session (its default storage key)
const SESSION_KEY = (() => {
  try {
    return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  } catch {
    return '';
  }
})();

// True when this browser holds an admin's saved session; visitors never do
export function hasStoredSession() {
  try {
    return Boolean(SESSION_KEY && localStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

let authClient = null;
let authClientPromise = null;
// Listeners that asked before the full client was needed; they are attached once something loads it
const waitingListeners = new Set();

export function loadAuthClient() {
  if (!authClientPromise) {
    authClientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      authClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        global: { fetch: resilientFetch },
      });
      for (const entry of waitingListeners) entry.attach(authClient);
      waitingListeners.clear();
      return authClient;
    });
  }
  return authClientPromise;
}

// Rows are read with the signed-in admin's token when there is one, as the full client did; otherwise anonymously
async function dataFetch(input, init = {}) {
  let token = supabaseAnonKey;
  if (authClient || hasStoredSession()) {
    try {
      const client = await loadAuthClient();
      const { data } = await client.auth.getSession();
      if (data.session?.access_token) token = data.session.access_token;
    } catch {}
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return resilientFetch(input, { ...init, headers });
}

const rest = new PostgrestClient(`${supabaseUrl || 'https://placeholder.supabase.co'}/rest/v1`, {
  headers: { apikey: supabaseAnonKey || 'placeholder' },
  fetch: dataFetch,
});

// Every auth call loads the full client first. onAuthStateChange answers at once, as supabase-js does;
// a visitor without a session is not made to download the client just to listen.
const auth = new Proxy(
  {},
  {
    get(_target, name) {
      if (name === 'onAuthStateChange') {
        return (callback) => {
          const entry = {
            subscription: null,
            cancelled: false,
            attach(client) {
              if (!this.cancelled) this.subscription = client.auth.onAuthStateChange(callback).data.subscription;
            },
          };
          if (authClient) entry.attach(authClient);
          else if (hasStoredSession()) loadAuthClient().then((client) => entry.attach(client));
          else waitingListeners.add(entry);
          return {
            data: {
              subscription: {
                unsubscribe() {
                  entry.cancelled = true;
                  waitingListeners.delete(entry);
                  entry.subscription?.unsubscribe();
                },
              },
            },
          };
        };
      }
      return (...args) => loadAuthClient().then((client) => client.auth[name](...args));
    },
  }
);

export const supabase = {
  from: (table) => rest.from(table),
  rpc: (fn, args, options) => rest.rpc(fn, args, options),
  auth,
};
