import { defineConfig } from '@playwright/test';

// Two groups: e2e/local (against `npm run dev`, every server answer replaced by a fixture) and e2e/live
// (read-only checks against E2E_BASE_URL). See docs/production-plan/wp/WP-10-browser-tests.md.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // The dev server compiles pages on first use, so one worker and generous limits keep the first requests from timing out
  workers: 1,
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { navigationTimeout: 45000, locale: 'ar-EG', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'local',
      testMatch: 'local/**/*.spec.ts',
      use: { baseURL: 'http://localhost:3000' },
    },
    {
      name: 'live',
      testMatch: 'live/**/*.spec.ts',
      use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:0' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    // Fake addresses: the browser never reaches them (mockServer answers or aborts every request to them)
    env: { VITE_SUPABASE_URL: 'https://e2e.supabase.co', VITE_SUPABASE_ANON_KEY: 'e2e-anon-key', DISABLE_HMR: 'true' },
  },
});
