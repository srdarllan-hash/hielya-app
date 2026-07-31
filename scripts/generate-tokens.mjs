import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'packages/design-tokens/src/tokens.json');
const cssPath = path.join(root, 'packages/design-tokens/src/tokens.css');
const tsPath = path.join(root, 'packages/design-tokens/src/tokens.ts');
const csvPath = path.join(root, 'packages/design-tokens/src/tokens-flat.csv');

const kebab = (value) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .toLowerCase();

export function serializeTokenValue(value, type) {
  if (type === 'shadow' && value && typeof value === 'object' && !Array.isArray(value)) {
    const { offsetX, offsetY, blur, spread, color } = value;
    if ([offsetX, offsetY, blur, spread, color].some((part) => typeof part !== 'string')) {
      throw new TypeError(`Invalid shadow token: ${JSON.stringify(value)}`);
    }
    return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  throw new TypeError(`Unsupported token value for type ${type ?? 'unknown'}: ${JSON.stringify(value)}`);
}

export function compileTokens(source) {
  const cssVariables = [];
  const flat = {};
  const rows = [['token', 'cssVariable', 'value', 'type', 'description']];
  const seen = new Set();

  function walk(node, parts = []) {
    if (node && typeof node === 'object' && '$value' in node) {
      const tokenName = parts.join('.');
      const cssVariable = `--hly-${parts.map(kebab).join('-')}`;
      if (seen.has(cssVariable)) throw new Error(`Duplicate CSS variable: ${cssVariable}`);
      seen.add(cssVariable);
      const value = serializeTokenValue(node.$value, node.$type);
      cssVariables.push(`  ${cssVariable}: ${value};`);
      flat[tokenName] = node.$value;
      rows.push([tokenName, cssVariable, value, node.$type ?? '', node.$description ?? '']);
      return;
    }
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      for (const [key, value] of Object.entries(node)) {
        if (!key.startsWith('$') && key !== 'meta') walk(value, [...parts, key]);
      }
    }
  }

  walk(source);
  const css = `/* Generated from HIELYA Design Tokens ${source.meta.version}. Do not edit manually. */\n:root{\n${cssVariables.join('\n')}\n}\n`;
  const opening=(css.match(/\{/g)??[]).length;
  const closing=(css.match(/\}/g)??[]).length;
  if(opening!==closing) throw new Error(`Generated CSS has unbalanced braces: ${opening}/${closing}`);
  if (/\{\s*"|\[object Object\]/.test(css)) throw new Error('Object serialization leaked into generated CSS');

  const ts = `export const tokenMeta=${JSON.stringify(source.meta, null, 2)} as const;\nexport const tokens=${JSON.stringify(flat, null, 2)} as const;\nexport type TokenName=keyof typeof tokens;\n`;
  const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = `${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}\n`;
  return { css, ts, csv, count: seen.size };
}

function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const output = compileTokens(source);
  const expected = [[cssPath, output.css], [tsPath, output.ts], [csvPath, output.csv]];
  const check = process.argv.includes('--check');
  if (check) {
    const mismatches = expected.filter(([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content);
    if (mismatches.length) {
      console.error(`Generated token artifacts are stale: ${mismatches.map(([file]) => path.relative(root, file)).join(', ')}`);
      process.exit(1);
    }
  } else {
    for (const [file, content] of expected) fs.writeFileSync(file, content, 'utf8');
  }
  console.log(`${check ? 'validated' : 'generated'} ${output.count} HIELYA token variables`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
