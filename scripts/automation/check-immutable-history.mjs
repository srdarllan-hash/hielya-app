import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const INDEX = 'docs/checkpoints/INDEX.md';
const MIGRATION = '.dev-migrations/0001_mvp_local_36_persistence.sql';
const SHA = /^[a-f0-9]{40}$/;
const CHECKPOINT = /^docs\/checkpoints\/(\d{4}-\d{2})\/HIELYA_CHECKPOINT_(\d{4}-\d{2}-\d{2})_v(\d+)\.(\d+)\.md$/;

/** Compare immutable Git objects, never execute code from the candidate tree. */
export function checkHistory(base, head, cwd = process.cwd()) {
  const git = (...args) => execFileSync('git', args, {
    cwd, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const ref of [base, head]) {
    if (!SHA.test(ref ?? '')) throw new Error('Full lowercase commit SHAs are required');
    if (git('rev-parse', '--verify', `${ref}^{commit}`).toString().trim() !== ref) {
      throw new Error('Ref does not resolve to the requested commit');
    }
  }
  // Force explicit reconciliation with the current trusted base before accepting.
  git('merge-base', '--is-ancestor', base, head);
  const tree = (ref) => new Map(git('ls-tree', '-rz', '--full-tree', ref, '--',
    'docs/checkpoints', MIGRATION).toString('utf8').split('\0').filter(Boolean).map((line) => {
    const match = /^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([\s\S]+)$/.exec(line);
    if (!match) throw new Error('Unsupported tree entry');
    return [match[4], { mode: match[1], type: match[2], sha: match[3] }];
  }));
  const before = tree(base);
  const after = tree(head);
  for (const required of [INDEX, MIGRATION]) {
    if (!before.has(required) || !after.has(required)) throw new Error(`Missing protected file: ${required}`);
  }
  for (const [path, entry] of before) {
    const next = after.get(path);
    if (!next || entry.mode !== next.mode || entry.type !== next.type) {
      throw new Error(`Protected path removed, renamed or mode changed: ${path}`);
    }
    if (path !== INDEX && entry.sha !== next.sha) throw new Error(`Historical bytes changed: ${path}`);
  }
  if (before.get(INDEX).mode !== '100644' || after.get(INDEX).type !== 'blob') {
    throw new Error('Index must remain a regular non-executable file');
  }
  const oldIndex = git('cat-file', 'blob', before.get(INDEX).sha);
  const newIndex = git('cat-file', 'blob', after.get(INDEX).sha);
  if (newIndex.length < oldIndex.length || !newIndex.subarray(0, oldIndex.length).equals(oldIndex)) {
    throw new Error('Index is append-only, including whitespace and line endings');
  }
  const appended = newIndex.subarray(oldIndex.length).toString('utf8');
  const versions = [...before.keys()].flatMap((path) => {
    const m = CHECKPOINT.exec(path);
    return m ? [[Number(m[3]), Number(m[4])]] : [];
  });
  const maxVersion = versions.sort((a, b) => a[0] - b[0] || a[1] - b[1]).at(-1) ?? [-1, -1];
  const seen = new Set(versions.map(([major, minor]) => `${major}.${minor}`));
  const added = [];
  for (const [path, entry] of after) {
    if (before.has(path)) continue;
    const m = CHECKPOINT.exec(path);
    if (!m || m[1] !== m[2].slice(0, 7) || entry.type !== 'blob' || entry.mode !== '100644') {
      throw new Error(`New checkpoint must have canonical path and regular-file mode: ${path}`);
    }
    const date = new Date(`${m[2]}T00:00:00Z`);
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== m[2]) {
      throw new Error(`Invalid checkpoint date: ${path}`);
    }
    const major = Number(m[3]);
    const minor = Number(m[4]);
    const version = `${major}.${minor}`;
    if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || seen.has(version) ||
        major < maxVersion[0] || (major === maxVersion[0] && minor <= maxVersion[1])) {
      throw new Error(`Checkpoint version is not new: ${path}`);
    }
    const relative = path.slice('docs/checkpoints/'.length);
    const row = appended.split('\n').some((line) =>
      line.startsWith(`| v${m[3]}.${m[4]} |`) && line.includes(`](./${relative})`));
    if (!row) throw new Error(`New checkpoint lacks appended index row: ${path}`);
    seen.add(version);
    added.push(path);
  }
  return { status: 'PASS', base_sha: base, head_sha: head, protected_files: before.size, new_checkpoints: added };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node check-immutable-history.mjs BASE_SHA HEAD_SHA');
    console.log(JSON.stringify(checkHistory(process.argv[2], process.argv[3]), null, 2));
  } catch (error) {
    console.error(`IMMUTABLE_HISTORY_BLOCKED: ${error.message}`);
    process.exitCode = 1;
  }
}
