import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const parseJsonInput = (name) => {
  try { return JSON.parse(process.env[name] ?? '[]'); }
  catch (error) { throw new Error(`${name} must be valid JSON: ${error.message}`); }
};
const screenId = process.env.SCREEN_ID;
const manifestPath = process.env.MANIFEST_PATH;
if (!screenId || !manifestPath) throw new Error('SCREEN_ID and MANIFEST_PATH are required');
const manifest = JSON.parse(fs.readFileSync(path.resolve(manifestPath), 'utf8'));
const states = parseJsonInput('SCREEN_STATES');
const viewports = parseJsonInput('REQUIRED_VIEWPORTS');
const protectedPaths = parseJsonInput('PROTECTED_PATHS');
const testSuites = parseJsonInput('TEST_SUITES');
const changedFiles = execFileSync('git', ['diff', '--name-only', `${process.env.BASE_SHA}...HEAD`], { encoding: 'utf8' }).split('\n').map((item) => item.trim()).filter(Boolean);
const protectedChanges = changedFiles.filter((file) => protectedPaths.some((pattern) => file.startsWith(pattern) || file.includes(pattern)));
const manifestStates = new Set(manifest.states ?? []);
const requiredStateCoverage = states.every((state) => manifestStates.has(state));
const manifestViewports = new Set((manifest.requiredViewports ?? manifest.viewports ?? []).map((item) => typeof item === 'string' ? item : item.physical ?? item.css));
const requiredViewportCoverage = viewports.every((viewport) => manifestViewports.has(viewport));
const result = {
  screenId,
  route: process.env.SCREEN_ROUTE,
  baseSha: process.env.BASE_SHA,
  baselineMode: process.env.BASELINE_MODE,
  manifestPath,
  states,
  protectedPaths,
  protectedChanges,
  testSuites,
  requiredViewports: viewports,
  checks: {
    screenIdMatches: manifest.screenId === screenId,
    requiredStateCoverage,
    requiredViewportCoverage,
    baselineModeValid: ['BASELINE_AUTHORING','GATE_VALIDATION'].includes(process.env.BASELINE_MODE ?? ''),
    testSuitesDeclared: testSuites.length > 0,
    noProtectedChanges: protectedChanges.length === 0,
  },
};
result.passed = Object.values(result.checks).every(Boolean);
const directory = path.join(process.cwd(), 'qa', 'screen-gates', screenId);
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'contract-validation.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
