import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@hielya/ui': fileURLToPath(
        new URL('./packages/ui/src/index.ts', import.meta.url),
      ),
      '@hielya/location': fileURLToPath(
        new URL('./packages/location/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: [
        'packages/ui/src/**/*.{ts,tsx}',
        'packages/location/src/**/*.{ts,tsx}',
        'scripts/generate-tokens.mjs',
      ],
      exclude: [
        '**/*.stories.{ts,tsx}',
        '**/*.types.ts',
        '**/*.data.ts',
        'packages/ui/src/index.ts',
      ],
      thresholds: undefined,
    },
  },
});
