import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const viteNode = resolve('node_modules/.bin/vite-node');
const databaseHarness = resolve(
  'tests/integration/product-detail-api-integration.database.ts',
);

export default async function globalSetup() {
  execFileSync(viteNode, [databaseHarness, 'setup'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });

  const response = await fetch('http://127.0.0.1:3106/__nextjs_disable_dev_indicator', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Unable to disable the Next.js development indicator: ${response.status}`);
  }
}
