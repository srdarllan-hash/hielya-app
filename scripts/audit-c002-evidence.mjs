import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const load = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const gate = load('qa/c002/C002_GATE_MANIFEST.json');
const visual = load('manifests/C-002-visual-baseline.json');
const manifest = load('manifests/C-002.json');
const baselineDirectory = path.join(root, 'tests/visual/location.visual.spec.ts-snapshots');
const baselineFiles = fs.readdirSync(baselineDirectory)
  .filter((file) => file.endsWith('.png'))
  .sort();
const missingEvidence = [];
const evidenceMismatches = [];
for (const [relative, expected] of Object.entries(gate.hashes)) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) missingEvidence.push(relative);
  else if (digest(file) !== expected) evidenceMismatches.push(relative);
}
const baselineMismatches = baselineFiles.filter((file) => visual.hashes[file] !== digest(path.join(baselineDirectory, file)));
const aggregateInput = baselineFiles
  .map((file) => `${digest(path.join(baselineDirectory, file))}  tests/visual/location.visual.spec.ts-snapshots/${file}\n`)
  .join('');
const aggregate = crypto.createHash('sha256').update(aggregateInput).digest('hex');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const checks = {
  sourceShaMatchesHead: gate.sourceSha === head,
  approvedFrozen: gate.status === 'APPROVED_FROZEN' && gate.approvedFrozen === true,
  workIntegrated: gate.workIntegrated === true,
  readyForC003Planning: gate.readyForC003Planning === true,
  strictGateValidation: gate.baselineMode === 'GATE_VALIDATION' && gate.strictVisualRegression === true,
  manifestFrozen: manifest.status === 'APPROVED_FROZEN' && manifest.approval?.approvedFrozen === true,
  evidenceComplete: missingEvidence.length === 0,
  evidenceHashesValid: evidenceMismatches.length === 0,
  baselineCount: baselineFiles.length === 63 && visual.baselineCount === 63 && gate.baselineCount === 63,
  baselineHashesValid: baselineMismatches.length === 0 && Object.keys(visual.hashes).length === 63,
  baselineAggregateValid: aggregate === visual.aggregateSha256,
};
const result = {
  screenId: 'C-002',
  head,
  missingEvidence,
  evidenceMismatches,
  baselineMismatches,
  aggregate,
  checks,
  passed: Object.values(checks).every(Boolean),
};
fs.writeFileSync(path.join(root, 'qa/c002/evidence-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
