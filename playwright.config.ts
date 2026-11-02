import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * Load .env.local (git-ignored) so tests can read E2E_TEST_EMAIL and
 * E2E_TEST_PASSWORD. Values are never written to committed files.
 */
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

const BASE_URL = 'http://localhost:3000';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* All tests share one test account, and the list test expects it to be
     empty, so tests run one at a time. */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  /* List results in the terminal; keep the HTML report without auto-opening it. */
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Start the dev server if it isn't already running on localhost:3000. */
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
