import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-API-HOST-ARCHITECTURE.md';
const PROFILE_PATH = 'docs/architecture/MVP_LOCAL_36_API_HOST_PROFILE.json';

interface ApiHostProfile {
  architecture: string;
  runtime: string;
  host: string;
  basePath: string;
  routeHandlersAuthorized: boolean;
  secondRuntimeAuthorized: boolean;
  microservicesAuthorized: boolean;
  productionAuthorized: boolean;
}

const sourceFiles = (root: string): string[] => {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:js|mjs|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
};

const combinedSource = (root: string): string => sourceFiles(root)
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

describe('MVP Local 36 API host architecture Gate', () => {
  it('defines the existing Next.js application as the only approved API host', () => {
    const profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) as ApiHostProfile;

    expect(profile).toEqual({
      architecture: 'MODULAR_TYPESCRIPT_MONOLITH',
      runtime: 'NEXTJS',
      host: 'apps/ui-lab',
      basePath: '/api/v1',
      routeHandlersAuthorized: false,
      secondRuntimeAuthorized: false,
      microservicesAuthorized: false,
      productionAuthorized: false,
    });
    expect(existsSync('apps/ui-lab/app')).toBe(true);
    expect(readdirSync('apps', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()).toEqual(['ui-lab']);
  });

  it('records future Route Handler placement and every module boundary', () => {
    const adr = readFileSync(ADR_PATH, 'utf8');
    const requiredDecisions = [
      'MODULAR_TYPESCRIPT_MONOLITH',
      'NEXTJS',
      'apps/ui-lab',
      '/api/v1',
      'apps/ui-lab/app/api/v1/**/route.ts',
      'packages/application',
      'packages/persistence',
      'packages/ui',
      'contracts/openapi',
      'routeHandlersAuthorized',
      'ui-lab` é histórico',
      'segunda aplicação',
      'microserviços',
      'Produção',
    ];

    requiredDecisions.forEach((decision) => expect(adr).toContain(decision));
    expect(adr).toContain('Este pacote ainda não é criado por este Gate.');
    expect(adr).toContain('Nenhum Route Handler é criado.');
  });

  it('keeps the approved package boundaries and creates no commercial Route Handler', () => {
    const application = combinedSource('packages/application');
    const persistence = combinedSource('packages/persistence');
    const ui = combinedSource('packages/ui');
    const routeHandlers = sourceFiles('apps/ui-lab/app/api/v1')
      .filter((path) => path.endsWith('/route.ts'));

    expect(application).not.toMatch(/from\s+['"](?:next(?:\/|['"])|react(?:\/|['"]))/);
    expect(persistence).not.toMatch(/from\s+['"]next(?:\/|['"])/);
    expect(persistence).not.toMatch(/\b(?:NextRequest|NextResponse)\b/);
    expect(ui).not.toMatch(/@hielya\/persistence|node:sqlite|DatabaseSync/);
    expect(routeHandlers).toEqual([]);
  });
});
