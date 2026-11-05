import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {apiDevServer} from './scripts/vite-api-dev';

export default defineConfig(({mode}) => {
  // The server functions in api/ read their settings (R2 keys and so on) from .env.local during development,
  // as they read them from the host's environment once deployed
  const env = loadEnv(mode, process.cwd(), '');
  for (const [name, value] of Object.entries(env)) if (process.env[name] === undefined) process.env[name] = value;

  return {
    plugins: [react(), tailwindcss(), apiDevServer()],
    build: {
      rolldownOptions: {
        output: {
          // Libraries that rarely change get their own files, so after a site update the browser
          // keeps them cached and downloads only the site's own code again
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/ },
              { name: 'supabase', test: /node_modules[\\/](@supabase|iceberg-js|tslib)[\\/]/ },
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
      proxy: {
        '/supabase-proxy': {
          target: process.env.VITE_SUPABASE_URL || 'https://uzdgvdovssrvaewfewkx.supabase.co',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
        },
        '/rest/v1': {
          target: process.env.VITE_SUPABASE_URL || 'https://uzdgvdovssrvaewfewkx.supabase.co',
          changeOrigin: true,
          secure: true,
        },
        '/auth/v1': {
          target: process.env.VITE_SUPABASE_URL || 'https://uzdgvdovssrvaewfewkx.supabase.co',
          changeOrigin: true,
          secure: true,
        },
        '/storage/v1': {
          target: process.env.VITE_SUPABASE_URL || 'https://uzdgvdovssrvaewfewkx.supabase.co',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
