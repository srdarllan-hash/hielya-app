import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const walk = (directory, files = []) => {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files); else files.push(full);
  }
  return files;
};
const runtime = [...walk(path.join(root, 'apps')), ...walk(path.join(root, 'packages/ui/src'))]
  .filter((file) => /\.(css|ts|tsx)$/.test(file));
const findings = [];
const exceptions = [];
for (const file of runtime) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const source = fs.readFileSync(file, 'utf8');
  const stripped = source
    .replace(/@media\s*\(max-width:\s*374px\)/g, '@media (max-width:TECHNICAL_LAYOUT_EXCEPTION)')
    .replace(/@media\s*\(min-width:\s*600px\)/g, '@media (min-width:TECHNICAL_LAYOUT_EXCEPTION)');
  if (/374px/.test(source)) exceptions.push({ file: relative, value: '374px', classification: 'TECHNICAL_LAYOUT_EXCEPTION', purpose: 'Small-mobile breakpoint inherited from frozen C-005.' });
  if (/600px/.test(source)) exceptions.push({ file: relative, value: '600px', classification: 'TECHNICAL_LAYOUT_EXCEPTION', purpose: 'Wide-preview breakpoint inherited from frozen C-005.' });
  for (const pattern of [
    { id: 'HEX_COLOR', regex: /#[0-9a-fA-F]{3,8}/g },
    { id: 'RGB_COLOR', regex: /rgba?\([^)]*\)/g },
    { id: 'PX_LITERAL', regex: /-?\d+(?:\.\d+)?px/g },
    { id: 'NUMERIC_FONT_WEIGHT', regex: /font-weight\s*:\s*\d+/g },
  ]) {
    for (const match of stripped.matchAll(pattern.regex)) findings.push({ file: relative, kind: pattern.id, value: match[0] });
  }
}
const tokenCss = fs.readFileSync(path.join(root, 'packages/design-tokens/src/tokens.css'), 'utf8');
const defined = new Set([...tokenCss.matchAll(/(--hly-[\w-]+)\s*:/g)].map((match) => match[1]));
const used = new Set();
for (const file of runtime.filter((item) => item.endsWith('.css'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/var\((--hly-[\w-]+)/g)) used.add(match[1]);
}
const undefinedVariables = [...used].filter((name) => !defined.has(name) && name !== '--hly-hero-image').sort();
const result = {
  tokenVersion: '1.2.0',
  scannedFiles: runtime.length,
  findings,
  exceptions,
  undefinedVariables,
  checks: {
    noUnauthorizedColorLiterals: findings.every((row) => !['HEX_COLOR', 'RGB_COLOR'].includes(row.kind)),
    noUnauthorizedPixelLiterals: findings.every((row) => row.kind !== 'PX_LITERAL'),
    noNumericFontWeights: findings.every((row) => row.kind !== 'NUMERIC_FONT_WEIGHT'),
    allTokenReferencesResolve: undefinedVariables.length === 0,
  },
};
result.passed = Object.values(result.checks).every(Boolean);
const output = path.join(root, 'qa/consolidation');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'runtime-style-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (!result.passed) process.exit(1);
