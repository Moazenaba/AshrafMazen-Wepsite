import { defineConfig } from 'vitest/config';

// Unit tests: plain functions and the server functions in api/. Component tests opt in to jsdom with
// a `// @vitest-environment jsdom` first line. No real database, no network.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts', 'scripts/**/*.test.mjs'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: ['src/data/**', 'src/dev/**', '**/*.test.*'],
      thresholds: { lines: 20, functions: 20 },
    },
  },
});
