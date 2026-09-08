import { openHomePresentation, presentationStates } from '../integration/home-presentation.fixtures';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const states = presentationStates;
for(const state of states){test(`C-005 presentation ${state} has no WCAG 2.1 AA axe violations`,async({page})=>{await openHomePresentation(page, state);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(results.violations).toEqual([])})}
