import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'qa', 'c001', 'visual-candidates');
const output = path.join(root, 'qa', 'c001', 'C001_VISUAL_CANDIDATE.json');

if (!fs.existsSync(source)) {
  console.error('C-001 visual candidate directory not found');
  process.exit(1);
}

const hashes = {};
for (const project of fs.readdirSync(source)) {
  const projectDir = path.join(source, project);
  if (!fs.statSync(projectDir).isDirectory()) continue;
  for (const file of fs.readdirSync(projectDir).filter((name) => name.endsWith('.json'))) {
    const row = JSON.parse(fs.readFileSync(path.join(projectDir, file), 'utf8'));
    hashes[row.key] = row.hash;
  }
}

const payload = {
  schemaVersion: '1.0.0',
  screenId: 'C-001',
  sourceCommit: process.env.GATE_SOURCE_SHA ?? process.env.GITHUB_SHA ?? 'LOCAL_NOT_OFFICIAL',
  generatedAt: new Date().toISOString(),
  mode: fs.existsSync(path.join(root, 'manifests', 'C-001-visual-baseline.json')) ? 'gate' : 'candidate',
  hashes: Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b))),
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Collected ${Object.keys(hashes).length} C-001 visual hashes`);
