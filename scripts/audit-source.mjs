import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(candidate);
    else files.push(candidate);
  }
}

walk(path.join(root, 'packages/ui/src'));
const sourceFiles = files.filter((file) => /\.(ts|tsx|css)$/.test(file));
const source = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const forbiddenMarkers = source.match(/\b(?:TODO|FIXME|HACK)\b/gi) ?? [];
const checks = {
  noTodo: forbiddenMarkers.length === 0,
  brand: !source.includes('HIELYÁ'),
  minimum: source.includes('€25'),
  radius: source.includes('4 km'),
  alcohol: source.includes('Entrega antes de 22:00'),
  tokens: fs.readFileSync(path.join(root, 'packages/design-tokens/src/tokens.json'), 'utf8').includes('"version": "1.2.0"'),
};

const report = {
  checks,
  scannedFiles: sourceFiles.map((file) => path.relative(root, file)),
  forbiddenMarkers,
};
fs.mkdirSync(path.join(root, 'qa/source'), { recursive: true });
fs.writeFileSync(path.join(root, 'qa/source/source-audit.json'), JSON.stringify(report, null, 2));
console.log(report);
if (Object.values(checks).some((value) => !value)) process.exit(1);
