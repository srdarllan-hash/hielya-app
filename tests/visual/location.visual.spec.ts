import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const cases = [
  { name: 'idle', query: 'state=idle' },
  { name: 'requesting-permission', query: 'state=requesting_permission' },
  { name: 'locating', query: 'state=locating' },
  { name: 'reverse-geocoding', query: 'state=reverse_geocoding' },
  { name: 'manual-entry', query: 'state=manual_entry' },
  { name: 'validating-manual-address', query: 'state=validating_manual_address' },
  { name: 'resolved', query: 'state=resolved' },
  { name: 'checking-service-area', query: 'state=checking_service_area' },
  { name: 'permission-denied', query: 'state=permission_denied' },
  { name: 'location-unavailable', query: 'state=location_unavailable' },
  { name: 'timeout', query: 'state=timeout' },
  { name: 'offline', query: 'state=offline' },
  { name: 'network-error', query: 'state=network_error' },
  { name: 'invalid-address', query: 'state=invalid_address' },
  { name: 'out-of-area', query: 'state=out_of_area' },
  { name: 'retrying', query: 'state=retrying' },
  { name: 'success', query: 'state=success' },
  { name: 'long-address', query: 'state=resolved&variant=long_address' },
  { name: 'hotel', query: 'state=resolved&variant=hotel' },
  { name: 'condominium', query: 'state=resolved&variant=condominium' },
] as const;

for (const item of cases) {
  test(`C-002 ${item.name} visual candidate`, async ({ page }, testInfo) => {
    await page.goto(`/location?driver=fake&${item.query}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`C-002-${item.name}.png`, { animations: 'disabled', fullPage: false });
    const directory = path.join('screenshots', 'c002', testInfo.project.name);
    fs.mkdirSync(directory, { recursive: true });
    await page.screenshot({ path: path.join(directory, `C-002_LOCATION_${item.name.toUpperCase().replaceAll('-', '_')}.png`), fullPage: false });
  });
}

test('C-002 reduced-motion visual candidate', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/location?driver=fake&state=locating');
  await expect(page).toHaveScreenshot('C-002-reduced-motion.png', { animations: 'disabled', fullPage: false });
  const directory = path.join('screenshots', 'c002', testInfo.project.name);
  fs.mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, 'C-002_LOCATION_REDUCED_MOTION.png'), fullPage: false });
});
