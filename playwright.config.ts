import { defineConfig } from '@playwright/test';

const baselineMode = process.env.BASELINE_MODE ?? 'GATE_VALIDATION';
if (!['BASELINE_AUTHORING', 'GATE_VALIDATION'].includes(baselineMode)) {
  throw new Error(`Unsupported BASELINE_MODE: ${baselineMode}`);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  updateSnapshots: baselineMode === 'BASELINE_AUTHORING' ? 'all' : 'none',
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'hires-1170', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 } },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
