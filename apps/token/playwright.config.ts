import { PlaywrightTestConfig, devices } from '@playwright/test';

const project = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
];

// https://playwright.dev/docs/ci
const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 15000,
  globalTimeout: 1000 * 60 * 20, // 20 mins
  use: {
    trace: 'on-first-retry',
    baseURL: process.env.CI
      ? process.env.PLAYWRIGHT_TEST_BASE_URL
      : `http://localhost:${process.env.PORT || 3000}`,
    // https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation#examples
    extraHTTPHeaders: {
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
      'x-vercel-set-bypass-cookie': 'true',
    },
  },
  projects: [project[0]!],
  testDir: './src/__tests__/',
  workers: 1,

  // globalSetup: 'src/__tests__/config/fixtures.ts',
  reporter: [['html', { outputFolder: 'playwright-report/', open: 'never' }]],
};
export default config;
