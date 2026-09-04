import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const source = resolve(root, 'public', 'assets');
const destination = resolve(root, 'apps', 'ui-lab', 'public', 'assets');

if (!existsSync(source)) {
  throw new Error(`Generated asset source does not exist: ${source}`);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });
console.log(`Synchronized HIELYA assets to ${destination}`);
