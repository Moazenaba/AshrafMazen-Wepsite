import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {apiDevServer} from './scripts/vite-api-dev';

// The site's stylesheet is written into index.html instead of linked, so the first paint does not wait
// for a second request (Lighthouse "render-blocking requests"). The file stays in assets/ for anything that links it.
function inlineEntryCss(): Plugin {
  return {
    name: 'inline-entry-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName === 'index.html');
      if (!html || html.type !== 'asset') return;
      let source = String(html.source);
      source = source.replace(/<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/g, (tag, file: string) => {
        const css = bundle[file];
        if (!css || css.type !== 'asset') return tag;
        return `<style>${String(css.source).replace(/<\/style/gi, '<\\/style')}</style>`;
      });
      html.source = source;
    },
  };
}

export default defineConfig(({mode}) => {
  // The server functions in api/ read their settings (R2 keys and so on) from .env.local during development,
  // as they read them from the host's environment once deployed
  const env = loadEnv(mode, process.cwd(), '');
  for (const [name, value] of Object.entries(env)) if (process.env[name] === undefined) process.env[name] = value;

  return {
    plugins: [react(), tailwindcss(), apiDevServer(), inlineEntryCss()],
    build: {
      rolldownOptions: {
        output: {
          // Libraries that rarely change get their own files, so after a site update the browser
          // keeps them cached and downloads only the site's own code again
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/ },
              // PostgREST is what every page reads rows with; the rest of Supabase (sign-in) loads only for admins
              { name: 'postgrest', test: /node_modules[\\/]@supabase[\\/]postgrest-js[\\/]/ },
              { name: 'supabase', test: /node_modules[\\/](@supabase[\\/](?!postgrest-js)|iceberg-js[\\/]|tslib[\\/])/ },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Development only: a failed direct call to Supabase is retried through this same-origin path (see src/lib/supabase.js).
      // The address comes from .env.local; nothing project-specific is written here.
      proxy: process.env.VITE_SUPABASE_URL
        ? {
            '/supabase-proxy': {
              target: process.env.VITE_SUPABASE_URL,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
            },
          }
        : undefined,
    },
  };
});
