import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default async function globalSetup() {
  execFileSync(resolve('node_modules/.bin/vite-node'), [
    resolve('tests/integration/c002-prequote-continuation-contract.database.ts'),
    'setup',
  ], { env: { ...process.env, NODE_ENV: 'test' }, stdio: 'inherit' });

  const response = await fetch('http://127.0.0.1:3110/__nextjs_disable_dev_indicator', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Unable to disable the Next.js development indicator: ${response.status}`);
  }
}
