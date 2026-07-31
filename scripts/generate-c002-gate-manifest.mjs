import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const walk = (directory, files = []) => {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files); else files.push(full);
  }
  return files;
};
const evidence = [
  ...walk(path.join(root, 'screenshots/c002')),
  ...walk(path.join(root, 'qa/c002')),
  ...walk(path.join(root, 'coverage')),
  path.join(root, 'manifests/C-002.json'),
  path.join(root, 'manifests/C-002-assets.json'),
].filter((file) => fs.existsSync(file));
const hashes = Object.fromEntries(evidence.sort().map((file) => [
  path.relative(root, file).replaceAll(path.sep, '/'),
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
]));
const report = {
  screenId: 'C-002',
  sourceSha: sha,
  status: 'IMPLEMENTATION_CANDIDATE',
  approvedFrozen: false,
  workIntegrated: false,
  baselineMode: process.env.BASELINE_MODE ?? 'BASELINE_AUTHORING',
  evidenceCount: Object.keys(hashes).length,
  hashes,
};
const output = path.join(root, 'qa/c002');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'C002_GATE_MANIFEST.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(output, 'SHA256SUMS.txt'), `${Object.entries(hashes).map(([file, hash]) => `${hash}  ${file}`).join('\n')}\n`);
fs.writeFileSync(path.join(output, 'GATE_REPORT.md'), `# C-002 Implementation Candidate\n\n- SHA: \`${sha}\`\n- Status: \`READY_FOR_WORK_INTEGRATION\` only when CI is green\n- Visual mode: \`${report.baselineMode}\`\n- APPROVED_FROZEN: \`false\`\n- Evidence files: \`${report.evidenceCount}\`\n`);
console.log(report);
