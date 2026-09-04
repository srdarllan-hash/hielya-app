import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const states=['ready','loading','closed','high-demand','error','empty-cart','alcohol-cutoff','out-of-area'];
for(const state of states){test(`C-005 ${state} has no WCAG 2.1 AA axe violations`,async({page})=>{await page.goto(`/?state=${state}`);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(results.violations).toEqual([])})}
