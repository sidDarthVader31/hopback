import { defineConfig } from '@playwright/test';

// `npm run media` regenerates the screenshots and GIFs used in the README.
export default defineConfig({
  testDir: 'tests/media',
  workers: 1,
  reporter: 'list',
  timeout: 180_000,
});
