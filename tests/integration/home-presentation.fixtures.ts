import { expect, type Page } from '@playwright/test';

export const presentationStates = ['ready', 'loading', 'closed', 'high-demand', 'error', 'empty-cart', 'alcohol-cutoff', 'out-of-area'] as const;
export type PresentationState = typeof presentationStates[number];

/** These are existing component stories, NOT public HomeCatalogRuntime routes. */
export async function openHomePresentation(page: Page, state: PresentationState) {
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=screens-c-005-home-master--${state}&viewMode=story`);
  await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-screen-state', state);
  await page.evaluate(async () => document.fonts.ready);
}
