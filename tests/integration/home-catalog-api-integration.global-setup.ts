import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const viteNode = resolve('node_modules/.bin/vite-node');
const databaseHarness = resolve(
  'tests/integration/home-catalog-api-integration.database.ts',
);

export default function globalSetup() {
  execFileSync(viteNode, [databaseHarness, 'setup'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
}
