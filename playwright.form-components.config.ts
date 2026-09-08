import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/form-components', fullyParallel: true, forbidOnly: Boolean(process.env.CI),
  updateSnapshots: 'none', retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/form-components', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:6006', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'chromium-360', use: { browserName: 'chromium', viewport: { width: 360, height: 800 } } },
    { name: 'chromium-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'webkit-390', use: { browserName: 'webkit', viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: 'python3 -m http.server 6006 --bind 127.0.0.1 --directory storybook-static', url: 'http://127.0.0.1:6006/iframe.html', reuseExistingServer: !process.env.CI },
});
