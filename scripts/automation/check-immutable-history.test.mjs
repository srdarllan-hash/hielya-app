import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, renameSync, rmSync, chmodSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { checkHistory } from './check-immutable-history.mjs';

const CP = 'docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v8.5.md';
const NEXT = 'docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-08_v8.8.md';
const INDEX = 'docs/checkpoints/INDEX.md';
const MIGRATION = '.dev-migrations/0001_mvp_local_36_persistence.sql';

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'hielya-history-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  const write = (path, data) => { mkdirSync(dirname(join(cwd, path)), { recursive: true }); writeFileSync(join(cwd, path), data); };
  git('init', '-q');
  git('config', 'user.name', 'Synthetic Test');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'core.fileMode', 'true');
  const commit = () => { git('add', '-A'); git('-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  write(CP, 'historical checkpoint\n');
  write(INDEX, '# Checkpoints\n');
  write(MIGRATION, 'CHECK (commercially_active = 0)\n');
  write('docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md', 'immutable policy\n');
  const base = commit();
  const indexNext = (path = NEXT, version = '8.8') => appendFileSync(join(cwd, INDEX),
    `| v${version} | 2026-09-08 | candidate | base | [record](./${path.slice('docs/checkpoints/'.length)}) | repo |\n`);
  return { cwd, git, write, commit, base, indexNext };
}

test('unchanged protected objects pass', (t) => {
  const f = fixture(t); f.write('unrelated.txt', 'change');
  assert.equal(checkHistory(f.base, f.commit(), f.cwd).status, 'PASS');
});
test('new checkpoint and append-only index pass', (t) => {
  const f = fixture(t); f.write(NEXT, 'new candidate\n'); f.indexNext();
  assert.deepEqual(checkHistory(f.base, f.commit(), f.cwd).new_checkpoints, [NEXT]);
});
const attacks = {
  'rewritten checkpoint': (f) => f.write(CP, 'rewritten'),
  'deleted checkpoint': (f) => rmSync(join(f.cwd, CP)),
  'renamed checkpoint': (f) => renameSync(join(f.cwd, CP), join(f.cwd, NEXT)),
  'executable checkpoint': (f) => chmodSync(join(f.cwd, CP), 0o755),
  'rewritten policy': (f) => f.write('docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md', 'relaxed'),
  'rewritten index': (f) => f.write(INDEX, '# Changed\n'),
  'deleted index': (f) => rmSync(join(f.cwd, INDEX)),
  'unindexed new checkpoint': (f) => f.write(NEXT, 'unindexed'),
  'arbitrary new file': (f) => f.write('docs/checkpoints/anything.md', 'not canonical'),
  'duplicate version': (f) => {
    const path = NEXT.replace('v8.8', 'v8.5'); f.write(path, 'duplicate'); f.indexNext(path, '8.5');
  },
  'invalid date': (f) => {
    const path = NEXT.replace('2026-09-08', '2026-09-31'); f.write(path, 'invalid date'); f.indexNext(path);
  },
  'symlink checkpoint': (f) => { symlinkSync('somewhere', join(f.cwd, NEXT)); f.indexNext(); },
  'modified migration 0001': (f) => f.write(MIGRATION, 'CHECK (commercially_active IN (0,1))'),
  'deleted migration 0001': (f) => rmSync(join(f.cwd, MIGRATION)),
};
for (const [name, attack] of Object.entries(attacks)) {
  test(`rejects ${name}`, (t) => {
    const f = fixture(t); attack(f);
    assert.throws(() => checkHistory(f.base, f.commit(), f.cwd));
  });
}
test('rejects mutable branch name', (t) => {
  const f = fixture(t); assert.throws(() => checkHistory('main', f.base, f.cwd));
});
test('rejects unknown commit', (t) => {
  const f = fixture(t); assert.throws(() => checkHistory('a'.repeat(40), f.base, f.cwd));
});
test('rejects a head that does not contain the trusted base', (t) => {
  const f = fixture(t); f.write('one', 'one'); const other = f.commit();
  f.git('checkout', '--detach', f.base); f.write('two', 'two'); const head = f.commit();
  assert.throws(() => checkHistory(other, head, f.cwd));
});
