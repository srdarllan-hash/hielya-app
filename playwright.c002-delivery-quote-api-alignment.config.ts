import { resolve } from 'node:path';

import { defineConfig } from '@playwright/test';

const baselineMode = process.env.BASELINE_MODE ?? 'GATE_VALIDATION';
if (!['BASELINE_AUTHORING', 'GATE_VALIDATION'].includes(baselineMode)) {
  throw new Error(`Unsupported BASELINE_MODE: ${baselineMode}`);
}

const evidencePhase = process.env.PLAYWRIGHT_EVIDENCE_PHASE ?? 'local';
if (!['local', 'a11y', 'functional', 'visual'].includes(evidencePhase)) {
  throw new Error(`Unsupported PLAYWRIGHT_EVIDENCE_PHASE: ${evidencePhase}`);
}

const databasePath = resolve('.tmp/c002-delivery-quote-api-alignment/catalog.sqlite');

export default defineConfig({
  testDir: './tests',
  testMatch: /c002-delivery-quote-api-alignment\.(?:a11y|functional|visual)\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  updateSnapshots: baselineMode === 'BASELINE_AUTHORING' ? 'all' : 'none',
  outputDir: `test-results/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1/${evidencePhase}`,
  reporter: [
    ['html', {
      outputFolder: `playwright-report/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1/${evidencePhase}`,
      open: 'never',
    }],
    ['list'],
  ],
  globalSetup: './tests/integration/c002-delivery-quote-api-alignment.global-setup.ts',
  globalTeardown: './tests/integration/c002-delivery-quote-api-alignment.global-teardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:3108',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 } } },
    {
      name: 'hires-1170',
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
    },
  ],
  webServer: {
    command: 'pnpm assets:prepare && pnpm exec next dev apps/ui-lab --hostname 127.0.0.1 --port 3108',
    url: 'http://127.0.0.1:3108',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      HIELYA_MVP_LOCAL_36_DATABASE_PATH: databasePath,
      HIELYA_SIMULATED_ROUTE_DISTANCE_KM: '2.5',
    },
  },
});
