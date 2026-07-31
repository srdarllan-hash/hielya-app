import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidenceRoot = path.resolve(process.env.EVIDENCE_ROOT ?? 'evidence');
const output = path.join(root, 'qa', 'pre-gate2-final');
fs.mkdirSync(output, { recursive: true });
const walk = (directory, files = []) => {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files); else files.push(full);
  }
  return files;
};
const files = walk(evidenceRoot).sort();
const hashes = files.map((file) => ({
  path: path.relative(root, file).replaceAll(path.sep, '/'),
  sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  bytes: fs.statSync(file).size,
}));
const coverageFiles = files.filter((file) => file.endsWith('coverage-summary.json'));
const coverage = coverageFiles.map((file) => ({ path: path.relative(root, file), summary: JSON.parse(fs.readFileSync(file, 'utf8')).total }));
const requiredArtifacts = ['architecture-evidence', 'screen-gate-C-005', 'screen-gate-C-001'];
const artifactCoverage = Object.fromEntries(requiredArtifacts.map((name) => [name, files.some((file) => file.includes(name))]));
const sourceSha = process.env.GATE_SOURCE_SHA ?? process.env.GITHUB_SHA ?? 'NOT_DOCUMENTED';
const manifest = {
  schemaVersion: '1.0.0',
  gate: 'PRE_GATE_2_ARCHITECTURE_CONSOLIDATION',
  repository: process.env.GITHUB_REPOSITORY ?? 'srdarllan-hash/hielya-app',
  branch: process.env.GATE_SOURCE_BRANCH ?? 'hielya/pre-gate2-architecture-consolidation',
  sourceSha,
  baselineMode: 'GATE_VALIDATION',
  designTokens: '1.2.0',
  componentLibrary: '1.2.0',
  frozenSources: {
    'C-005': 'be61e1168b93d973101496cc66cb54d006aba9cc',
    'C-001': 'c838cfc26176b2e748bdbd037147a7f362d5a3c2',
  },
  screens: {
    'C-005': 'APPROVED_FROZEN_ARCHITECTURE_REGRESSION_PASSED',
    'C-001': 'APPROVED_FROZEN_ARCHITECTURE_REGRESSION_PASSED',
    'C-002': 'AUTHORIZED_NOT_STARTED',
    'C-003': 'BLOCKED',
    'C-004': 'BLOCKED',
  },
  coverage,
  coverageThreshold: 'PENDING_DECISION',
  artifactCoverage,
  evidenceFiles: hashes.length,
  evidenceBytes: hashes.reduce((sum, row) => sum + row.bytes, 0),
  readyForGate2: Object.values(artifactCoverage).every(Boolean) && hashes.length > 0,
  workIntegrated: false,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(output, 'PRE_GATE2_GATE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(output, 'SHA256SUMS.txt'), `${hashes.map((row) => `${row.sha256}  ${row.path}`).join('\n')}\n`);
const report = `# HIELYA Pre-Gate 2 Architecture Consolidation\n\n- Source SHA: \`${sourceSha}\`\n- Design Tokens: \`1.2.0\`\n- Component Library: \`1.2.0\`\n- Baseline mode: \`GATE_VALIDATION\`\n- Evidence files: \`${hashes.length}\`\n- Coverage threshold: \`PENDING_DECISION\`\n- Work integrated: \`FALSE\`\n\n## Decision\n\n\`READY_FOR_GATE_2 = ${manifest.readyForGate2 ? 'TRUE' : 'FALSE'}\`\n`;
fs.writeFileSync(path.join(output, 'GATE_REPORT.md'), report);
console.log(manifest);
if (!manifest.readyForGate2) process.exit(1);
