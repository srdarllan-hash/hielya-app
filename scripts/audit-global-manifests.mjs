import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = ['components.json','primitives.json','assets.json','screens.json','certifications.json','workflows.json','artifacts.json','versions.json','C-005.json','C-001.json','C-001-visual-baseline.json'];
const missing = required.filter((file) => !fs.existsSync(path.join(root, 'manifests', file)));
const load = (file) => JSON.parse(fs.readFileSync(path.join(root, 'manifests', file), 'utf8'));
const screens = load('screens.json');
const certs = load('certifications.json');
const components = load('components.json');
const versions = load('versions.json');
const c005 = load('C-005.json');
const c001 = load('C-001.json');
const result = {
  required,
  missing,
  checks: {
    noMissingManifests: missing.length === 0,
    c005Certified: c005.status === 'APPROVED_FROZEN' && c005.certifiedCommit === 'be61e1168b93d973101496cc66cb54d006aba9cc',
    c001Certified: c001.status === 'APPROVED_FROZEN' && c001.certifiedCommit === 'c838cfc26176b2e748bdbd037147a7f362d5a3c2',
    twoImmutableCertificationRecords: certs.certifications.length === 2 && certs.certifications.every((item) => item.status === 'APPROVED_FROZEN' && item.artifactDigest && item.workflowRunId),
    c002NotStarted: screens.screens.find((item) => item.screenId === 'C-002')?.sourceStatus === 'AUTHORIZED_NOT_STARTED_BUT_ARCHITECTURE_BLOCKED',
    blockedAuthScreens: ['C-003','C-004'].every((id) => screens.screens.find((item) => item.screenId === id)?.sourceStatus === 'BLOCKED'),
    tokenVersion: components.designTokens === '1.2.0' && versions.designTokens.consolidationCandidate === '1.2.0',
    componentVersion: components.version === '1.2.0' && versions.componentLibrary.consolidationCandidate === '1.2.0',
    coverageThresholdPendingDecision: versions.coverageThreshold === 'PENDING_DECISION',
  },
};
result.passed = Object.values(result.checks).every(Boolean);
const output = path.join(root, 'qa/consolidation');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'manifest-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
