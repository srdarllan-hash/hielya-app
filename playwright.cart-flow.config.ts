import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/cart-flow', fullyParallel: true, forbidOnly: true, retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/cart-flow', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3108', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'chromium-360', use: { browserName: 'chromium', viewport: { width: 360, height: 800 } } },
    { name: 'webkit-390', use: { browserName: 'webkit', viewport: { width: 390, height: 844 } } },
  ],
  webServer: [
    { command: 'pnpm exec next start apps/ui-lab --hostname 127.0.0.1 --port 3108', url: 'http://127.0.0.1:3108/login', reuseExistingServer: !process.env.CI, timeout: 120000 },
    { command: 'python3 -m http.server 6006 --bind 127.0.0.1 --directory storybook-static', url: 'http://127.0.0.1:6006/iframe.html', reuseExistingServer: !process.env.CI },
  ],
});
