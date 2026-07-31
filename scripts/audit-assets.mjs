import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifests/assets.json'), 'utf8'));
const base = path.join(root, 'public/assets');
const rows = manifest.physicalAssets.map((relative) => {
  const file = path.join(base, relative);
  return { path: relative, exists: fs.existsSync(file), sha256: fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null };
});
const duplicateHashes = Object.entries(rows.reduce((index, row) => {
  if (row.sha256) (index[row.sha256] ??= []).push(row.path);
  return index;
}, {})).filter(([, files]) => files.length > 1).map(([sha256, files]) => ({ sha256, files }));
const aliasChecks = Object.entries(manifest.aliases).map(([alias, target]) => ({ alias, target, targetExists: manifest.physicalAssets.includes(target), aliasNotPhysical: !manifest.physicalAssets.includes(alias) }));
const result = {
  physicalCount: rows.length,
  uniqueContentCount: new Set(rows.map((row) => row.sha256).filter(Boolean)).size,
  aliasCount: aliasChecks.length,
  pendingCount: manifest.pending.length,
  rows,
  aliases: aliasChecks,
  duplicateHashes,
  checks: {
    allPhysicalAssetsExist: rows.every((row) => row.exists),
    tenUniquePhysicalAssets: rows.length === 10 && new Set(rows.map((row) => row.sha256)).size === 10,
    noDuplicatePhysicalContent: duplicateHashes.length === 0,
    aliasesResolve: aliasChecks.every((row) => row.targetExists && row.aliasNotPhysical),
    noPlaceholderBrandAssets: manifest.pending.every((row) => ['ASSET_MISSING', 'REQUIRES_VALIDATION'].includes(row.status)),
  },
};
result.passed = Object.values(result.checks).every(Boolean);
const output = path.join(root, 'qa/consolidation');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'asset-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(output, 'asset-inventory.csv'), ['path,status,sha256', ...rows.map((row) => `${row.path},${row.exists ? 'REUSABLE' : 'MISSING'},${row.sha256 ?? ''}`)].join('\n') + '\n');
console.log(result);
if (!result.passed) process.exit(1);
