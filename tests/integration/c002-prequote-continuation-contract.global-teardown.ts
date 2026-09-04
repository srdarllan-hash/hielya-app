import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default function globalTeardown() {
  execFileSync(resolve('node_modules/.bin/vite-node'), [
    resolve('tests/integration/c002-prequote-continuation-contract.database.ts'),
    'teardown',
  ], { env: { ...process.env, NODE_ENV: 'test' }, stdio: 'inherit' });
}
