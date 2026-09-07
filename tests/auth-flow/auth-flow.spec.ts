import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Synthetic fixtures only. No production SMS, tokens or phone numbers. Recording is disabled in config.
const challengeId = '11111111-1111-4111-8111-111111111111';
const response = { challengeId, expiresInSeconds: 300, resendAfterSeconds: 60 };
const verified = { sessionToken: 'x'.repeat(43), expiresInSeconds: 2592000, customer: { id: '22222222-2222-4222-8222-222222222222', phoneE164: '+34612345678', phoneVerifiedAt: '2026-09-07T00:00:00Z', status: 'ACTIVE' } };
async function publicApis(page: Page) {
  await page.route('**/api/v1/catalog/categories', route => route.fulfill({ json: [] }));
  await page.route('**/api/v1/catalog/products**', route => route.fulfill({ json: { items: [], page: 1, pageSize: 20, total: 0 } }));
  await page.route('**/api/v1/store/state', route => route.fulfill({ status: 503, json: { code: 'CONFIGURATION_UNAVAILABLE' } }));
}
async function enter(page: Page, resend = 60) {
  await publicApis(page);
  await page.route('**/api/v1/auth/otp/request', route => route.fulfill({ status: 202, json: { ...response, resendAfterSeconds: resend } }));
  await page.goto('/login');
  await expect(page.getByRole('textbox', { name: 'Número de teléfono' })).not.toBeFocused();
  await page.getByRole('textbox', { name: 'Número de teléfono' }).fill('612345678');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('textbox', { name: 'Dígito 1 de 6' })).toBeFocused();
}
async function paste(page: Page, text = '１２３４５６') {
  await page.getByRole('textbox', { name: 'Dígito 1 de 6' }).evaluate((el, value) => {
    const clipboardData = new DataTransfer(); clipboardData.setData('text', value);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  }, text);
}
test('public catalog and Ahora no never require OTP', async ({ page }) => {
  await publicApis(page); let requests = 0;
  await page.route('**/api/v1/auth/otp/**', route => { requests++; return route.abort(); });
  await page.goto('/'); await expect(page.locator('[data-authenticated]')).toHaveAttribute('data-authenticated', 'false');
  await page.goto('/login'); await page.getByRole('button', { name: 'Ahora no' }).click();
  await expect(page).toHaveURL(/\/$/); expect(requests).toBe(0);
});
test('automatic completion authenticates Home in memory; reload loses authentication without storage', async ({ page }) => {
  let verifies = 0;
  await page.route('**/api/v1/auth/otp/verify', route => { verifies++; return route.fulfill({ json: verified }); });
  await enter(page); await paste(page);
  await expect(page).toHaveURL(/\/$/); await expect(page.locator('[data-authenticated]')).toHaveAttribute('data-authenticated','true');
  expect(verifies).toBe(1);
  const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }));
  expect(stored).toEqual({ local: 0, session: 0, cookie: '' });
  await page.reload(); await expect(page.locator('[data-authenticated]')).toHaveAttribute('data-authenticated','false');
});
test('network uncertainty preserves digits, explicit retry maps unavailable, new challenge after cooldown', async ({ page }) => {
  let verifies = 0, requests = 0;
  await enter(page, 2);
  await page.route('**/api/v1/auth/otp/request', route => { requests++; return route.fulfill({status:202,json:response}); });
  await page.route('**/api/v1/auth/otp/verify', route => ++verifies === 1 ? route.abort('failed') : route.fulfill({ status:400,json:{code:'OTP_UNAVAILABLE'} }));
  await paste(page);
  await expect(page.getByRole('button',{name:'Reintentar'})).toBeFocused();
  expect(await page.getByRole('textbox').evaluateAll(els => els.every(el => (el as HTMLInputElement).value.length === 1))).toBe(true);
  expect(verifies).toBe(1); await page.getByRole('button',{name:'Reintentar'}).click();
  await expect(page.getByRole('alert')).toHaveText('Este código no está disponible. Solicita otro cuando puedas.');
  await expect(page.getByRole('button',{name:'Reenviar código'})).toBeEnabled({timeout:6000});
  expect(requests).toBe(0); await page.getByRole('button',{name:'Reenviar código'}).click();
  await expect(page.getByRole('textbox',{name:'Dígito 1 de 6'})).toBeFocused(); expect(requests).toBe(1);
  expect(await page.getByRole('textbox').evaluateAll(els => els.every(el => (el as HTMLInputElement).value.length === 0))).toBe(true);
});
test('invalid result clears group and focuses first input, keyboard exits once', async ({ page }) => {
  await page.route('**/api/v1/auth/otp/verify', route => route.fulfill({status:400,json:{code:'OTP_INVALID'}}));
  await enter(page); await paste(page);
  const first=page.getByRole('textbox',{name:'Dígito 1 de 6'}); await expect(first).toBeFocused();
  expect(await page.getByRole('textbox').evaluateAll(els=>els.every(el=>(el as HTMLInputElement).value===''))).toBe(true);
  await page.keyboard.press('End'); await expect(page.getByRole('textbox',{name:'Dígito 6 de 6'})).toBeFocused();
  await page.keyboard.press('Home'); await expect(first).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'Cambiar número'})).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(first).toBeFocused();
});
test('Retry-After keeps resend locked and changing number returns to preserved phone', async ({ page }) => {
  await enter(page, 0);
  await page.route('**/api/v1/auth/otp/request', route => route.fulfill({status:429,headers:{'retry-after':'120'},json:{code:'OTP_RESEND_COOLDOWN'}}));
  await page.getByRole('button',{name:'Reenviar código'}).click(); await expect(page.getByRole('button',{name:'Reenviar código'})).toBeDisabled();
  await expect(page.getByText(/Podrás solicitar otro código en 1\d\d s\./)).toBeVisible();
  await page.getByRole('button',{name:'Cambiar número'}).click();
  await expect(page.getByRole('textbox',{name:'Número de teléfono'})).toHaveValue('612 345 678');
  await expect(page.getByRole('button',{name:'Continuar'})).toBeDisabled();
});
test('changing number while verify is pending discards late session', async ({ page }) => {
  await enter(page); let release!: () => void; const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/v1/auth/otp/verify', async route => { await gate; await route.fulfill({json:verified}).catch(()=>undefined); });
  await paste(page); await page.getByRole('button',{name:'Cambiar número'}).click(); release();
  await expect(page.getByRole('heading',{name:'Entra con tu móvil'})).toBeVisible();
  await page.getByRole('button',{name:'Ahora no'}).click(); await expect(page.locator('[data-authenticated]')).toHaveAttribute('data-authenticated','false');
});
const states=['phone-empty','phone-typing','phone-valid','phone-loading','phone-invalid','phone-network-error','phone-service-error','phone-cooldown','otp-empty','otp-disabled','otp-partial','otp-complete','otp-verifying','otp-invalid','otp-expired','otp-locked','otp-network-error','otp-unavailable','otp-service-error','otp-cooldown','otp-resend-available','otp-resending','otp-resend-error','otp-success'];
for(const state of states) test(`axe and responsive layout: ${state}`,async({page})=>{
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=screens-authentication--${state}&viewMode=story&globals=a11y.manual:!true`);
  await expect(page.locator('[data-screen-id]')).toBeVisible();
  const result=await new AxeBuilder({page}).include('#storybook-root').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(await page.getByRole('button',{name:'Verificar',exact:true}).count()).toBe(0);
});
