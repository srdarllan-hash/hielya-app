import { expect, test } from '@playwright/test';

const states = [
  'idle','requesting_permission','locating','reverse_geocoding','manual_entry','validating_manual_address','resolved',
  'permission_denied','location_unavailable','timeout','offline','network_error','invalid_address','out_of_area','success',
] as const;

for (const state of states) {
  test(`C-002 ${state} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/location?state=${state}&driver=fake`);
    await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', state);
    expect(errors).toEqual([]);
  });
}

test('C-002 completes a manual-address flow and emits LOCATION_CONFIRMED', async ({ page }) => {
  await page.goto('/location?state=idle&driver=fake&scenario=serviceable');
  await page.evaluate(() => {
    (window as typeof window & { __locationOutcomes?: unknown[] }).__locationOutcomes = [];
    window.addEventListener('hielya:location-outcome', (event) => {
      (window as typeof window & { __locationOutcomes?: unknown[] }).__locationOutcomes?.push((event as CustomEvent).detail);
    });
  });
  await page.getByRole('button', { name: 'Introducir dirección' }).click();
  await page.getByRole('combobox', { name: 'Dirección de entrega' }).fill('Paseo');
  await page.getByRole('button', { name: 'Buscar dirección' }).click();
  await page.getByText('Paseo Marítimo Rey de España, 65').click();
  await page.getByRole('button', { name: 'Confirmar dirección' }).click();
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'success');
  await page.getByRole('button', { name: 'Continuar' }).click();
  const outcomes = await page.evaluate(() => (window as typeof window & { __locationOutcomes?: unknown[] }).__locationOutcomes);
  expect(outcomes).toEqual([expect.objectContaining({ type: 'LOCATION_CONFIRMED' })]);
  await expect(page.locator('[data-screen-id="C-003"]')).toHaveCount(0);
  await expect(page.locator('[data-screen-id="C-005"]')).toHaveCount(0);
});

test('C-002 completes a fake GPS flow only after explicit action', async ({ page }) => {
  await page.goto('/location?state=idle&driver=fake&scenario=serviceable');
  await expect(page.locator('[data-state="idle"]')).toBeVisible();
  await page.getByRole('button', { name: 'Usar mi ubicación' }).click();
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'resolved');
  await page.getByRole('button', { name: 'Confirmar dirección' }).click();
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'success');
});

test('C-002 permission denial keeps manual address available', async ({ page }) => {
  await page.goto('/location?state=idle&driver=fake&scenario=permission_denied');
  await page.getByRole('button', { name: 'Usar mi ubicación' }).click();
  await expect(page.getByRole('heading', { name: 'Permiso no concedido' })).toBeVisible();
  await page.getByRole('button', { name: 'Introducir dirección' }).click();
  await expect(page.getByRole('combobox')).toBeVisible();
});

test('C-002 consumes out-of-area result without client distance calculation', async ({ page }) => {
  await page.goto('/location?state=idle&driver=fake&scenario=out_of_area');
  await page.getByRole('button', { name: 'Introducir dirección' }).click();
  await page.getByRole('combobox').fill('Paseo');
  await page.getByRole('button', { name: 'Buscar dirección' }).click();
  await page.getByText('Paseo Marítimo Rey de España, 65').click();
  await page.getByRole('button', { name: 'Confirmar dirección' }).click();
  await expect(page.getByRole('heading', { name: 'Fuera del área de entrega' })).toBeVisible();
});

test('C-002 address suggestions support keyboard selection', async ({ page }) => {
  await page.goto('/location?state=manual_entry&driver=fake');
  const input = page.getByRole('combobox');
  await input.fill('Paseo');
  await page.getByRole('button', { name: 'Buscar dirección' }).click();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.getByRole('button', { name: 'Confirmar dirección' })).toBeVisible();
});
