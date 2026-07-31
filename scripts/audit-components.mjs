import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifests/components.json'), 'utf8'));
const primitives = JSON.parse(fs.readFileSync(path.join(root, 'manifests/primitives.json'), 'utf8'));
const names = manifest.canonical.map((item) => item.name);
const missingFiles = names.filter((name) => !fs.existsSync(path.join(root, `packages/ui/src/components/${name}.tsx`)));
const callbackRequirements = {
  SearchField: ['onChange', 'onSubmit', 'onFilter'], CategoryChip: ['onSelect'], BottomNavigation: ['onNavigate'],
  SectionHeader: ['onAction'], ProductCard: ['onAdd'], PackCard: ['onAdd'], DeliveryQuoteCard: ['onChangeAddress'],
};
const callbackChecks = Object.fromEntries(Object.entries(callbackRequirements).map(([name, requirements]) => {
  const source = fs.readFileSync(path.join(root, `packages/ui/src/components/${name}.tsx`), 'utf8');
  return [name, requirements.every((item) => source.includes(item)) && source.includes('disabled')];
}));
const storySource = fs.readFileSync(path.join(root, 'packages/ui/src/components/FoundationComponents.stories.tsx'), 'utf8');
const result = {
  canonicalCount: names.length,
  primitiveCount: primitives.primitives.length,
  adapterCount: manifest.adapters.length,
  missingFiles,
  callbackChecks,
  checks: {
    version: manifest.version === '1.2.0',
    noDuplicateCanonical: names.length === new Set(names).size,
    noMissingFiles: missingFiles.length === 0,
    iconPrimitive: primitives.primitives.some((item) => item.name === 'Icon'),
    adaptersPointToCanonicalTargets: manifest.adapters.every((item) => names.includes(item.target)),
    interactiveContracts: Object.values(callbackChecks).every(Boolean),
    storiesCoverBrand: storySource.includes('BrandLockupVariants'),
    storiesCoverFeedback: storySource.includes('FeedbackVariants'),
    storiesCoverActions: storySource.includes('ProductCardStates') && storySource.includes('SearchFieldStates'),
  },
};
result.passed = Object.values(result.checks).every(Boolean);
const output = path.join(root, 'qa/consolidation');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'component-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
