import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = process.env.C001_BASE_SHA ?? 'be61e1168b93d973101496cc66cb54d006aba9cc';
const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const protectedPatterns = [
  /^packages\/ui\/src\/screens\/home\//,
  /^manifests\/C-005\.json$/,
  /^tests\/(unit|visual|accessibility|functional)\/home/i,
  /^\.github\/workflows\/c005-gate\.yml$/,
];

const protectedChanges = changed.filter((file) => protectedPatterns.some((pattern) => pattern.test(file)));
const blockedScreenChanges = changed.filter((file) => /screens\/(location|auth|otp)|C-00[234]/i.test(file));

const productionFiles = [
  'packages/ui/src/screens/splash/SplashScreen.tsx',
  'packages/ui/src/screens/splash/SplashScreen.module.css',
  'packages/ui/src/screens/splash/splash.types.ts',
  'packages/ui/src/screens/splash/splash.copy.ts',
].map((file) => path.join(root, file));

const source = productionFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const css = fs.readFileSync(path.join(root, 'packages/ui/src/screens/splash/SplashScreen.module.css'), 'utf8');
const checks = {
  frozenBaseIsAncestor: true,
  noC005ProtectedChanges: protectedChanges.length === 0,
  noBlockedScreenImplementation: blockedScreenChanges.length === 0,
  noTodoMarkers: !/\b(?:TODO|FIXME|HACK)\b/.test(source),
  noCanvaDependency: !/Canva/i.test(source),
  noInventedTimer: !/(setTimeout|setInterval|durationMs|minimumVisibleMs)/.test(source),
  noAuthDestination: !/(C-003|C-004)/.test(
    fs.readFileSync(path.join(root, 'packages/ui/src/screens/splash/SplashScreen.tsx'), 'utf8'),
  ),
  noParallelHexColors: !/#[0-9a-fA-F]{3,8}/.test(css),
  noParallelRgbColors: !/(rgba?|hsla?)\(/.test(css),
  usesFrozenTokens: css.includes('var(--hly-'),
  routeExists: fs.existsSync(path.join(root, 'apps/ui-lab/app/splash/page.tsx')),
  manifestExists: fs.existsSync(path.join(root, 'manifests/C-001.json')),
};

try {
  execFileSync('git', ['merge-base', '--is-ancestor', base, 'HEAD']);
} catch {
  checks.frozenBaseIsAncestor = false;
}

const result = {
  base,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  changedFiles: changed,
  protectedChanges,
  blockedScreenChanges,
  checks,
  passed: Object.values(checks).every(Boolean),
};

const outputDir = path.join(root, 'qa/c001/source');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'scope-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
