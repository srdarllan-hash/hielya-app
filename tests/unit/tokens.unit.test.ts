import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileTokens, serializeTokenValue } from '../../scripts/generate-tokens.mjs';

const root = process.cwd();
const tokenSource = JSON.parse(fs.readFileSync(path.join(root, 'packages/design-tokens/src/tokens.json'), 'utf8'));

describe('Design Token compiler 1.2.0', () => {
  it('serializes official elevation objects as valid CSS shadow strings', () => {
    expect(serializeTokenValue(tokenSource.elevation.low.$value, 'shadow')).toBe('0px 2px 8px 0px rgba(0,0,0,0.24)');
    expect(serializeTokenValue(tokenSource.elevation.medium.$value, 'shadow')).toBe('0px 8px 24px 0px rgba(0,0,0,0.32)');
  });

  it('generates deterministic CSS, TypeScript and CSV without object leakage or duplicate variables', () => {
    const output = compileTokens(tokenSource);
    expect(output.css).not.toMatch(/\[object Object\]|\{\s*"/);
    expect(output.css.match(/--hly-elevation-medium:/g)).toHaveLength(1);
    expect(output.css.match(/--hly-elevation-low:/g)).toHaveLength(1);
    expect(output.ts).toContain('export const tokens=');
    expect(output.csv).toContain('elevation.low');
    expect(output.count).toBeGreaterThan(100);
  });

  it('matches every checked-in generated binding', () => {
    const output = compileTokens(tokenSource);
    expect(fs.readFileSync(path.join(root, 'packages/design-tokens/src/tokens.css'), 'utf8')).toBe(output.css);
    expect(fs.readFileSync(path.join(root, 'packages/design-tokens/src/tokens.ts'), 'utf8')).toBe(output.ts);
    expect(fs.readFileSync(path.join(root, 'packages/design-tokens/src/tokens-flat.csv'), 'utf8')).toBe(output.csv);
  });
});
