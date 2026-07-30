import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dir = path.join(root, 'qa/gate');
fs.mkdirSync(dir, { recursive: true });

const sha = process.env.GATE_SOURCE_SHA || process.env.GITHUB_SHA || 'LOCAL_NOT_OFFICIAL';
const branch = process.env.GATE_SOURCE_BRANCH || process.env.GITHUB_REF_NAME || 'local';
const manifest = {
  screenId: 'C-005',
  branch,
  commitSha: sha,
  tokens: '1.1.0',
  components: '1.1.1',
  status: 'QA_PASSED_CANDIDATE',
  generatedAt: new Date().toISOString(),
  checks: [
    'lint',
    'typecheck',
    'unit',
    'next-build',
    'storybook-build',
    'axe',
    'visual-responsive',
    'source-audit',
    'manifest-audit',
  ],
};

fs.writeFileSync(path.join(dir, 'C005_GATE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

const files = [];
for (const base of ['manifests', 'qa', 'screenshots']) {
  const target = path.join(root, base);
  if (!fs.existsSync(target)) continue;
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else files.push(file);
    }
  };
  walk(target);
}

const sums = files
  .sort()
  .map((file) => `${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${path.relative(root, file)}`);
fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
fs.writeFileSync(
  path.join(dir, 'GATE_REPORT.md'),
  `# C-005 Gate 1A\n\n- Commit: ${sha}\n- Branch: ${branch}\n- Tokens: 1.1.0\n- Components: 1.1.1\n- Result: QA_PASSED_CANDIDATE\n\nFinal APPROVED_FROZEN requires review of this same commit's uploaded evidence.\n`,
);

console.log(manifest);
