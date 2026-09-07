import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const open = async (page: Page, id: string) => {
  // Playwright owns this axe run; keep the addon manual in this iframe only to avoid two concurrent scans.
  // Normal Storybook previews retain automatic a11y. No rule, state or browser is skipped here.
  await page.goto(`/iframe.html?id=foundation-${id}&viewMode=story&globals=a11y.manual:!true`);
  await expect(page.locator('.hly-field').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};
const paste = (cell: Locator, text: string) => cell.evaluate((element, value) => {
  const data = new DataTransfer(); data.setData('text/plain', value);
  element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
}, text);

const states = {
  input: ['empty', 'filled', 'hover', 'focus', 'valid', 'invalid', 'blur-error', 'disabled', 'read-only', 'loading', 'adornments', 'autofill'],
  phoneinput: ['empty', 'typing', 'valid', 'invalid', 'disabled', 'read-only', 'loading', 'focus', 'autofill', 'validation'],
  otpinput: ['empty', 'partial', 'complete', 'loading', 'invalid', 'expired', 'locked', 'cooldown', 'network-error', 'unavailable', 'service-unavailable', 'success', 'disabled', 'read-only', 'focus', 'keyboard'],
};
for (const [component, variants] of Object.entries(states)) for (const state of variants) {
  test(`${component} ${state}: accessible state`, async ({ page }) => {
    await open(page, `${component}--${state}`);
    const result = await new AxeBuilder({ page }).include('#storybook-root').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.map(({ id, impact }) => ({ id, impact }))).toEqual([]);
  });
}

test('one Tab stop, both exits and internal keyboard editing', async ({ page }) => {
  await open(page, 'otpinput--keyboard'); const cells = page.getByRole('textbox');
  await page.getByRole('button', { name: 'Antes' }).focus(); await page.keyboard.press('Tab'); await expect(cells.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(cells.nth(1)).toBeFocused();
  await page.keyboard.press('End'); await expect(cells.nth(5)).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Después' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(cells.nth(5)).toBeFocused();
  await page.keyboard.press('Home'); await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Antes' })).toBeFocused();
  await cells.nth(0).click(); await page.keyboard.type('12'); await expect(cells.nth(2)).toBeFocused();
  await page.keyboard.press('Backspace'); await expect(cells.nth(1)).toBeFocused(); await expect(cells.nth(1)).toHaveValue('');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Delete'); await expect(cells.nth(0)).toHaveValue('');
  await page.keyboard.type('9'); await expect(cells.nth(1)).toBeFocused(); await cells.nth(0).click(); await page.keyboard.type('8'); await expect(cells.nth(0)).toHaveValue('8');
});

for (const source of ['012345', '０１２３４５', '01-23 45', '012345678']) test(`OTP complete paste variant ${['012345', '０１２３４５', '01-23 45', '012345678'].indexOf(source)}`, async ({ page }) => {
  await open(page, 'otpinput--empty'); await paste(page.getByRole('textbox').first(), source);
  await expect(page.getByRole('group')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('textbox').nth(5)).toBeFocused();
  await expect(page.getByRole('textbox').first()).toHaveValue('0');
  await page.keyboard.type('9'); await expect(page.getByRole('textbox').nth(5)).toHaveValue('5');
});

test('partial, excessive invalid paste and full autofill distribution', async ({ page }) => {
  await open(page, 'otpinput--complete'); const cells = page.getByRole('textbox');
  await paste(cells.nth(3), '12'); await expect(cells.nth(2)).toBeFocused(); await expect(cells.nth(5)).toHaveValue('');
  await paste(cells.nth(2), '123456x'); await expect(cells.nth(2)).toHaveValue('');
  await expect(page.getByText('No se ha pegado el contenido. Revisa el formato.')).toBeVisible();
  await cells.first().fill('012345'); await expect(cells.nth(5)).toHaveValue('5'); await expect(page.getByRole('group')).toHaveAttribute('aria-busy', 'true');
});

test('phone native submit, caret and full-width paste', async ({ page }) => {
  await open(page, 'phoneinput--validation'); const phone = page.getByRole('textbox');
  await page.getByRole('button', { name: 'Continuar' }).click(); await expect(page.getByRole('alert')).toHaveText('Introduce tu número de teléfono.');
  await paste(phone, '+３４ ６１２ ３４５ ６７８'); await expect(phone).toHaveValue('612 345 678');
  await phone.evaluate((node: HTMLInputElement) => node.setSelectionRange(4, 4)); await phone.press('Backspace'); await expect(phone).toHaveValue('613 456 78');
  await phone.evaluate((node: HTMLInputElement) => node.setSelectionRange(0, node.value.length)); await paste(phone, '612345678');
  await expect(phone).not.toHaveAttribute('aria-invalid');
  await paste(phone, 'letters'); await expect(phone).toHaveValue('612 345 678');
});

test('retry secondary md automatic width preserves code and uses unavailable copy', async ({ page }) => {
  await open(page, 'otpinput--network-error'); const retry = page.getByRole('button', { name: 'Reintentar' });
  await expect(retry).toBeFocused(); await expect(retry).toHaveClass(/hly-button--secondary/); await expect(retry).not.toHaveClass(/hly-button--full/);
  await retry.click(); await expect(page.getByRole('alert')).toHaveText('Este código no está disponible. Solicita otro cuando puedas.');
  await expect(page.getByRole('textbox').first()).toHaveValue('0');
});

test('ratified token geometry: six cells at 328 and two triplets below it', async ({ page }) => {
  await open(page, 'otpinput--empty');
  const frame = page.locator('.hly-story-frame');
  await frame.evaluate((node: HTMLElement) => { node.style.padding = 'var(--hly-space-16)'; });
  const cells = page.getByRole('textbox');
  for (let i = 0; i < 6; i += 1) { const box = await cells.nth(i).boundingBox(); expect(box?.width).toBe(48); expect(box?.height).toBe(56); }
  expect((await cells.first().boundingBox())?.y).toBe((await cells.nth(5).boundingBox())?.y);
  await frame.evaluate((node: HTMLElement) => { node.style.width = 'var(--hly-dimension-300)'; });
  const first = await cells.first().boundingBox(); const fourth = await cells.nth(3).boundingBox();
  expect(fourth!.y - first!.y).toBe(64); expect(fourth!.x).toBe(first!.x);
  await cells.nth(3).focus(); await expect(cells.nth(3)).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
