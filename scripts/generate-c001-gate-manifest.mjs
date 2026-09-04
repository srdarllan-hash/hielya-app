import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gateDir = path.join(root, 'qa', 'c001', 'gate');
fs.mkdirSync(gateDir, { recursive: true });

const sourceSha = process.env.GATE_SOURCE_SHA ?? process.env.GITHUB_SHA ?? 'LOCAL_NOT_OFFICIAL';
const sourceBranch = process.env.GATE_SOURCE_BRANCH ?? process.env.GITHUB_HEAD_REF ?? 'local';
const baselinePath = path.join(root, 'manifests', 'C-001-visual-baseline.json');
const baselineMode = fs.existsSync(baselinePath) ? 'gate' : 'candidate';
const candidatePath = path.join(root, 'qa', 'c001', 'C001_VISUAL_CANDIDATE.json');
const candidate = fs.existsSync(candidatePath) ? JSON.parse(fs.readFileSync(candidatePath, 'utf8')) : null;
const scopeAudit = JSON.parse(fs.readFileSync(path.join(root, 'qa/c001/source/scope-audit.json'), 'utf8'));
const manifestAudit = JSON.parse(fs.readFileSync(path.join(root, 'qa/c001/source/manifest-audit.json'), 'utf8'));

const manifest = {
  schemaVersion: '1.0.0',
  screenId: 'C-001',
  screenName: 'Splash / PWA bootstrap',
  sourceSha,
  sourceBranch,
  baseFrozenCommit: 'be61e1168b93d973101496cc66cb54d006aba9cc',
  tokens: '1.1.0',
  components: '1.1.1',
  baselineMode,
  visualHashCount: Object.keys(candidate?.hashes ?? {}).length,
  checks: [
    'clean-install',
    'lint',
    'typecheck',
    'unit-tests',
    'next-build',
    'storybook-build',
    'axe',
    'functional-playwright',
    'visual-responsive',
    'scope-audit',
    'manifest-audit',
  ],
  scopeAuditPassed: scopeAudit.passed,
  manifestAuditPassed: manifestAudit.passed,
  gateStatus: baselineMode === 'gate' ? 'QA_PASSED_CANDIDATE' : 'BASELINE_CANDIDATE',
  branchIntegrated: true,
  qaPassed: baselineMode === 'gate',
  approvedFrozen: false,
  workIntegrated: false,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(gateDir, 'C001_GATE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(gateDir, 'GATE_REPORT.md'),
  `# C-001 Splash Gate 1B\n\n- Source commit: \`${sourceSha}\`\n- Branch: \`${sourceBranch}\`\n- Frozen base: \`be61e1168b93d973101496cc66cb54d006aba9cc\`\n- Tokens: \`1.1.0\`\n- Components: \`1.1.1\`\n- Visual mode: \`${baselineMode}\`\n- Visual hashes: \`${manifest.visualHashCount}\`\n- Scope audit: \`${scopeAudit.passed ? 'PASS' : 'FAIL'}\`\n- Manifest audit: \`${manifestAudit.passed ? 'PASS' : 'FAIL'}\`\n- Workflow candidate result: \`${manifest.gateStatus}\`\n\n\`APPROVED_FROZEN\` requires inspection of this exact commit's uploaded evidence.\n`,
);

const roots = ['docs/c001', 'manifests', 'qa/c001', 'screenshots/c001'];
const files = [];
const walk = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (!file.endsWith('SHA256SUMS.txt')) files.push(file);
  }
};
for (const directory of roots) walk(path.join(root, directory));
if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) files.push(path.join(root, 'pnpm-lock.yaml'));

const sums = [...new Set(files)]
  .sort()
  .map((file) => `${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${path.relative(root, file)}`);
fs.writeFileSync(path.join(gateDir, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
console.log(manifest);
