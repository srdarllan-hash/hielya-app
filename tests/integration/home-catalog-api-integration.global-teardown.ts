import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const viteNode = resolve('node_modules/.bin/vite-node');
const databaseHarness = resolve(
  'tests/integration/home-catalog-api-integration.database.ts',
);

export default function globalTeardown() {
  execFileSync(viteNode, [databaseHarness, 'teardown'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
}
