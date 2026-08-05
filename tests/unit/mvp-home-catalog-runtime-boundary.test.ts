import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(path, 'utf8');

describe('Home catalog runtime boundary', () => {
  const pageSource = read('apps/ui-lab/app/page.tsx');
  const runtimeSource = read(
    'apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx',
  );
  const clientSource = read(
    'apps/ui-lab/src/client/mvp-local-36/catalog-client.ts',
  );
  const mapperSource = read(
    'apps/ui-lab/src/client/mvp-local-36/home-catalog-mapper.ts',
  );

  it('makes the operational page depend only on the HTTP runtime', () => {
    expect(pageSource).toContain('HomeCatalogRuntime');
    expect(pageSource).not.toMatch(/home\.data|@hielya\/application|@hielya\/persistence/);
  });

  it('does not import runtime fixtures, persistence, application services or catalog artifacts', () => {
    const operationalSource = [pageSource, runtimeSource, clientSource, mapperSource].join('\n');
    expect(operationalSource).not.toMatch(
      /home\.data|contracts\/catalog|contract-fixture|@hielya\/application|@hielya\/persistence|node:sqlite/,
    );
    expect(operationalSource).not.toContain('HYA-');
  });

  it('limits HTTP consumption to category and product collection endpoints', () => {
    expect(clientSource).toContain("'/api/v1/catalog/categories'");
    expect(clientSource).toContain("'/api/v1/catalog/products'");
    expect(clientSource).not.toMatch(/catalog\/products\/\$\{|delivery\/quote/);
  });

  it('uses explicit DTO-to-view mapping without spreading HTTP DTO objects', () => {
    expect(mapperSource).not.toMatch(/\.\.\.(product|category|component|page)/);
    expect(mapperSource).toContain('id: product.id');
    expect(mapperSource).toContain('quantity: component.quantity');
  });

  it('does not contain historic runtime prices or synthetic runtime fallback', () => {
    const operationalSource = [pageSource, runtimeSource, clientSource, mapperSource].join('\n');
    expect(operationalSource).not.toMatch(/Victoria Málaga|Estrella Galicia|€1,40|€1,50/);
    expect(runtimeSource).not.toMatch(/fallback|synthetic/i);
  });
});
