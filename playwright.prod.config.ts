import { defineConfig, devices } from '@playwright/test';

/** Production build config — points to port 3000, no webServer */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  retries: 0,
  workers: 2,
  reporter: 'dot',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: 'global-setup.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — production build already running on port 3000
});
