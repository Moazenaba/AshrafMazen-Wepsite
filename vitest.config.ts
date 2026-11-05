import { defineConfig } from 'vitest/config';

// Unit tests: plain functions and the server functions in api/. No browser, no database, no network.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
});
