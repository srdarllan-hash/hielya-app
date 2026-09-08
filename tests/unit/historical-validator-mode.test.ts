import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const validators = [
  {
    script: 'scripts/validate-mvp-local-36-openapi.mjs',
    artifact: 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml',
    hashError: 'Original OpenAPI hash mismatch',
  },
  {
    script: 'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
    artifact: 'contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json',
    hashError: 'Composite artifact hash mismatch',
  },
];

describe.each(validators)('$script admission versus content regression', ({ script, artifact, hashError }) => {
  it('retains strict historical admission by default in CI', () => {
    const result = spawnSync(process.execPath, [script], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_ACTIONS: 'true' },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unauthorized files changed');
    expect(result.stderr).toContain('CLAUDE.md');
  });

  it('rejects misspelled or ambiguous CLI modes instead of disabling admission silently', () => {
    for (const args of [['--scope=regresion'], ['--scope=regression', '--scope=historical'], ['--skip-scope']]) {
      const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Unsupported validator scope mode|Expected only --scope/);
    }
  });

  it('still rejects a changed frozen artifact in explicit regression mode', () => {
    const directory = mkdtempSync(join(tmpdir(), 'hielya-freeze-negative-'));
    try {
      const target = join(directory, artifact);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Buffer.concat([readFileSync(artifact), Buffer.from('\nunauthorized change\n')]));
      const result = spawnSync(process.execPath, [resolve(script), '--scope=regression'], {
        cwd: directory,
        encoding: 'utf8',
        env: { ...process.env, GITHUB_ACTIONS: 'true' },
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(hashError);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
