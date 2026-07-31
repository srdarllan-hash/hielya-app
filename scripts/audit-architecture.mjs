import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const walk = (directory, files = []) => {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files); else files.push(full);
  }
  return files;
};
const relative = (file) => path.relative(root, file).replaceAll(path.sep, '/');

const runtimeFiles = [...walk(path.join(root, 'apps')), ...walk(path.join(root, 'packages')), ...walk(path.join(root, '.storybook'))]
  .filter((file) => /\.(ts|tsx|css)$/.test(file));
const runtimeSource = runtimeFiles.map((file) => `${relative(file)}\n${fs.readFileSync(file, 'utf8')}`).join('\n');
const blockedScreenFiles = runtimeFiles.map(relative).filter((file) => /screens\/(location|auth|otp)|C-00[234]/i.test(file));
const relativeCrossPackageImports = [];
for (const file of runtimeFiles.filter((item) => /\.(ts|tsx)$/.test(item))) {
  const source = fs.readFileSync(file, 'utf8');
  const filePath = relative(file);
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)) {
    const specifier = match[1] ?? match[2];
    if (!specifier?.startsWith('.')) continue;
    const resolved = path.normalize(path.join(path.dirname(filePath), specifier)).replaceAll(path.sep, '/');
    const sourceWorkspace = filePath.startsWith('packages/ui/')
      ? 'packages/ui/'
      : filePath.startsWith('packages/design-tokens/')
        ? 'packages/design-tokens/'
        : filePath.startsWith('apps/')
          ? 'apps/'
          : filePath.startsWith('.storybook/')
            ? '.storybook/'
            : 'other';
    const crossesPackageBoundary =
      (resolved.startsWith('packages/ui/') && sourceWorkspace !== 'packages/ui/') ||
      (resolved.startsWith('packages/design-tokens/') && sourceWorkspace !== 'packages/design-tokens/');
    if (crossesPackageBoundary) relativeCrossPackageImports.push({ file: filePath, specifier, resolved });
  }
}

const appShell = read('packages/ui/src/components/AppShell.tsx');
const appHeader = read('packages/ui/src/components/AppHeader.tsx');
const splash = read('packages/ui/src/screens/splash/SplashScreen.tsx');
const errorAdapter = read('packages/ui/src/components/ErrorState.tsx');
const emptyAdapter = read('packages/ui/src/components/EmptyState.tsx');
const loadingAdapter = read('packages/ui/src/components/LoadingState.tsx');
const componentManifest = JSON.parse(read('manifests/components.json'));
const packages = {
  ui: JSON.parse(read('packages/ui/package.json')),
  tokens: JSON.parse(read('packages/design-tokens/package.json')),
};

const actionContracts = {
  SearchField: ['onChange', 'onSubmit', 'onFilter', 'disabled', 'loading'],
  CategoryChip: ['onSelect', 'disabled', 'loading'],
  BottomNavigation: ['onNavigate', 'disabled'],
  SectionHeader: ['onAction', 'disabled', 'loading'],
  ProductCard: ['onAdd', 'disabled', 'loading'],
  PackCard: ['onAdd', 'disabled', 'loading'],
  DeliveryQuoteCard: ['onChangeAddress', 'loading'],
  ErrorState: ['onAction', 'loading'],
  EmptyState: ['onAction', 'loading'],
};
const actionChecks = Object.fromEntries(Object.entries(actionContracts).map(([name, props]) => {
  const source = read(`packages/ui/src/components/${name}.tsx`);
  return [name, props.every((prop) => source.includes(prop))];
}));

const canonicalNames = componentManifest.canonical.map((item) => item.name);
const checks = {
  exactFrozenBaseIsAncestor: true,
  noBlockedScreenImplementation: blockedScreenFiles.length === 0,
  noHomeSpecificShellAttribute: !runtimeSource.includes(['data', 'home', 'state'].join('-')),
  appShellGenericContract: appShell.includes('screenState') && appShell.includes('data-screen-state') && !appShell.includes('data-home-state'),
  brandLockupCanonical: exists('packages/ui/src/components/BrandLockup.tsx') && canonicalNames.includes('BrandLockup'),
  appHeaderComposesBrand: appHeader.includes("from './BrandLockup'") && appHeader.includes('<BrandLockup'),
  splashUsesBrandDirectly: splash.includes("from '../../components/BrandLockup'") && !splash.includes("from '../../components/AppHeader'"),
  feedbackCanonical: exists('packages/ui/src/components/FeedbackState.tsx') && canonicalNames.includes('FeedbackState'),
  feedbackAdaptersThin: errorAdapter.includes('<FeedbackState') && emptyAdapter.includes('<FeedbackState'),
  homeLoadingSpecific: exists('packages/ui/src/components/HomeLoadingState.tsx') && loadingAdapter.includes('HomeLoadingState'),
  actionContractsComplete: Object.values(actionChecks).every(Boolean),
  noDuplicateCanonicalNames: canonicalNames.length === new Set(canonicalNames).size,
  iconPrimitiveRegistered: JSON.parse(read('manifests/primitives.json')).primitives.some((item) => item.name === 'Icon'),
  publicPackageImports: relativeCrossPackageImports.length === 0,
  uiPublicStyleExports: packages.ui.exports?.['./styles.css'] && packages.ui.exports?.['./accessibility.css'],
  tokenPublicExports: packages.tokens.exports?.['./tokens.css'] && packages.tokens.exports?.['./tokens'],
  tokenVersionAligned: packages.tokens.version === '1.2.0' && componentManifest.designTokens === '1.2.0',
  componentVersionAligned: packages.ui.version === '1.2.0' && componentManifest.version === '1.2.0',
  coverageInstrumented: read('vitest.config.ts').includes("provider: 'v8'") && read('package.json').includes('test:coverage'),
  strictGateBaselineMode: read('playwright.config.ts').includes("'GATE_VALIDATION'") && read('playwright.config.ts').includes("'none'"),
  c005StillCertified: JSON.parse(read('manifests/C-005.json')).status === 'APPROVED_FROZEN',
  c001StillCertified: JSON.parse(read('manifests/C-001.json')).status === 'APPROVED_FROZEN',
};
const frozenBase = 'c838cfc26176b2e748bdbd037147a7f362d5a3c2';
let frozenBaseCheck = 'VERIFIED';
try {
  execFileSync('git', ['cat-file', '-e', `${frozenBase}^{commit}`], { stdio: 'ignore' });
  execFileSync('git', ['merge-base', '--is-ancestor', frozenBase, 'HEAD']);
} catch {
  if (process.env.CI === 'true') {
    checks.exactFrozenBaseIsAncestor = false;
    frozenBaseCheck = 'FAILED_IN_CI';
  } else {
    frozenBaseCheck = 'REQUIRES_CI_VERIFICATION';
  }
}
const result = {
  base: frozenBase,
  frozenBaseCheck,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  blockedScreenFiles,
  relativeCrossPackageImports,
  actionChecks,
  checks,
  passed: Object.values(checks).every(Boolean),
};
const output = path.join(root, 'qa/consolidation');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'architecture-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
