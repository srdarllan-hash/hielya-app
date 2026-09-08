import { webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// Diagnostic only: synthetic phone, no OTP verification, no value/body/header recording.
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', 'apps/ui-lab', '--hostname', '127.0.0.1', '--port', '3108'], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const results = [];
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch('http://127.0.0.1:3108/login')).ok) break; } catch {}
    await delay(500);
    if (i === 119) throw new Error('SERVER_NOT_READY');
  }
  browser = await webkit.launch();
  for (const mode of ['natural', 'held-javascript', 'hydrated-control']) {
    const repetitions = mode === 'natural' ? 30 : 5;
    for (let iteration = 0; iteration < repetitions; iteration++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      let requests = 0;
      await page.route('**/api/v1/auth/otp/request', route => {
        requests++;
        return route.fulfill({ status: 202, json: { challengeId: '11111111-1111-4111-8111-111111111111', expiresInSeconds: 300, resendAfterSeconds: 60 } });
      });
      let release;
      const released = new Promise(resolve => { release = resolve; });
      if (mode === 'held-javascript') await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, async route => { await released; await route.continue(); });
      const hydrated = () => page.locator('input[type="tel"]').evaluate(input => Object.keys(input).some(key => key.startsWith('__reactProps$')));
      const state = () => page.locator('input[type="tel"]').evaluate(input => {
        const key = Object.keys(input).find(key => key.startsWith('__reactProps$'));
        return { domLength: input.value.length, reactLength: key ? String(input[key].value ?? '').length : null, buttonDisabled: document.querySelector('button[type="submit"]').disabled };
      });
      await page.goto('http://127.0.0.1:3108/login', { waitUntil: mode === 'held-javascript' ? 'commit' : 'load' });
      const input = page.getByRole('textbox', { name: 'Número de teléfono' });
      await input.waitFor();
      if (mode === 'hydrated-control') await page.waitForFunction(() => Object.keys(document.querySelector('input[type="tel"]') ?? {}).some(key => key.startsWith('__reactProps$')));
      const hydratedBefore = await hydrated();
      await input.fill('612345678');
      const afterFill = await state();
      release();
      await page.waitForLoadState('load');
      await page.waitForFunction(() => Object.keys(document.querySelector('input[type="tel"]') ?? {}).some(key => key.startsWith('__reactProps$')));
      await delay(1200);
      const settled = await state();
      let recovered = null;
      if (settled.buttonDisabled) {
        await input.fill(''); await input.fill('612345678');
        recovered = await state();
      }
      const beforeSubmit = requests;
      await page.getByRole('button', { name: 'Continuar', exact: true }).click({ timeout: 3000 });
      await page.getByRole('textbox', { name: 'Dígito 1 de 6' }).waitFor({ timeout: 3000 });
      results.push({ mode, iteration, hydratedBefore, afterFill, settled, recovered, beforeSubmit, requests });
      await context.close();
    }
  }
  console.log(JSON.stringify({ revision: process.env.DIAGNOSTIC_REVISION, results }));
  writeFileSync('auth-diagnostic-results.json', JSON.stringify({ revision: process.env.DIAGNOSTIC_REVISION, results }, null, 2));
} finally {
  await browser?.close(); server.kill();
}
