import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const HOST_ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-API-HOST-ARCHITECTURE.md';
const PUBLIC_API_ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-LAYER.md';
const PROFILE_PATH = 'docs/architecture/MVP_LOCAL_36_API_HOST_PROFILE.json';

interface AuthorizedRouteHandler {
  method: 'GET' | 'POST';
  path: string;
  file: string;
}

interface ApiHostProfile {
  architecture: string;
  runtime: string;
  host: string;
  basePath: string;
  routeHandlersAuthorized: boolean;
  authorizedRouteHandlers: AuthorizedRouteHandler[];
  secondRuntimeAuthorized: boolean;
  microservicesAuthorized: boolean;
  realMapProviderAuthorized: boolean;
  authenticationAuthorized: boolean;
  cartLayerAuthorized: boolean;
  inventoryMutationAuthorized: boolean;
  productionAuthorized: boolean;
}

const AUTHORIZED_ROUTE_HANDLERS: AuthorizedRouteHandler[] = [
  {
    method: 'GET',
    path: '/catalog/categories',
    file: 'apps/ui-lab/app/api/v1/catalog/categories/route.ts',
  },
  {
    method: 'GET',
    path: '/catalog/products',
    file: 'apps/ui-lab/app/api/v1/catalog/products/route.ts',
  },
  {
    method: 'GET',
    path: '/catalog/products/{productId}',
    file: 'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts',
  },
  {
    method: 'POST',
    path: '/delivery/quote',
    file: 'apps/ui-lab/app/api/v1/delivery/quote/route.ts',
  },
];

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
      routeHandlersAuthorized: true,
      authorizedRouteHandlers: AUTHORIZED_ROUTE_HANDLERS,
      secondRuntimeAuthorized: false,
      microservicesAuthorized: false,
      realMapProviderAuthorized: false,
      authenticationAuthorized: false,
      cartLayerAuthorized: false,
      inventoryMutationAuthorized: false,
      productionAuthorized: false,
    });
    expect(existsSync('apps/ui-lab/app')).toBe(true);
    expect(readdirSync('apps', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()).toEqual(['ui-lab']);
  });

  it('preserves the host decision and records the exact Public Service/API authorization', () => {
    const hostAdr = readFileSync(HOST_ADR_PATH, 'utf8');
    const publicApiAdr = readFileSync(PUBLIC_API_ADR_PATH, 'utf8');
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

    requiredDecisions.forEach((decision) => expect(hostAdr).toContain(decision));
    for (const route of AUTHORIZED_ROUTE_HANDLERS) {
      expect(publicApiAdr).toContain(route.path);
      expect(publicApiAdr).toContain(route.file);
    }
    expect(publicApiAdr).toContain('category` resolve por `id` UUID persistido ou por `slug` persistido');
    expect(publicApiAdr).toContain('`q` pesquisa somente `sku` e `name`');
    expect(publicApiAdr).toContain('`availableOnly=true`');
    expect(publicApiAdr).toContain('CONFIGURATION_UNAVAILABLE');
    expect(publicApiAdr).toContain('OUT_OF_AREA');
    expect(publicApiAdr).toContain('HTTP 400');
  });

  it('keeps the package boundaries and creates only the four authorized Route Handlers', () => {
    const application = combinedSource('packages/application');
    const persistence = combinedSource('packages/persistence');
    const ui = combinedSource('packages/ui');
    const routeHandlers = sourceFiles('apps/ui-lab/app/api/v1')
      .filter((path) => path.endsWith('/route.ts'));

    expect(application).not.toMatch(/from\s+['"](?:next(?:\/|['"])|react(?:\/|['"])|node:sqlite)/);
    expect(persistence).not.toMatch(/from\s+['"]next(?:\/|['"])/);
    expect(persistence).not.toMatch(/\b(?:NextRequest|NextResponse)\b/);
    expect(ui).not.toMatch(/@hielya\/persistence|node:sqlite|DatabaseSync/);
    expect(routeHandlers.sort()).toEqual(AUTHORIZED_ROUTE_HANDLERS.map((route) => route.file).sort());
    for (const route of AUTHORIZED_ROUTE_HANDLERS) {
      const source = readFileSync(route.file, 'utf8');
      expect(source).toMatch(/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/);
      expect(source).toMatch(new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${route.method}\\b`));
      expect(source).not.toMatch(/node:sqlite|DatabaseSync|Stripe|google(?:maps)?/i);
    }
  });
});
