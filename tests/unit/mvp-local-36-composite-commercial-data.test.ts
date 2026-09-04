import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MVP_LOCAL_36_CONTRACT_FIXTURE } from '../../packages/ui/src/domain/mvp-local.contract-fixture';

const artifactPath = 'contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json';
const adrPath = 'docs/decisions/ADR-MVP-LOCAL-36-COMPOSITE-COMMERCIAL-DATA.md';
const expectedSha256 = 'c2db49b2f7aa66cf0e75d3bfe18fb34296c40ef836cd0d8354a1993cc7f4d6b7';

interface ComponentRecord {
  sku: string;
  quantity: number;
}

interface CompositeRecord {
  sku: string;
  name: string;
  salePriceCents: number;
  currency: string;
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge: number;
  isPack: boolean;
  iceIncluded: boolean;
  mvpStatus: string;
  commerciallyActive: boolean;
  components: ComponentRecord[];
}

interface CompositeArtifact {
  profile: string;
  version: string;
  status: string;
  currency: string;
  pricePolicy: {
    initialBasis: string;
    discountCents: number;
    automaticRecalculation: boolean;
  };
  maxPerOrderPolicy: {
    initialBasis: string;
    automaticRecalculation: boolean;
  };
  commercialActivationAuthorized: boolean;
  composites: CompositeRecord[];
}

const readArtifact = (): CompositeArtifact => JSON.parse(readFileSync(artifactPath, 'utf8')) as CompositeArtifact;

const collectKeys = (value: unknown, keys: Set<string>): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    keys.add(key);
    collectKeys(item, keys);
  });
};

describe('MVP Local 36 owner-approved composite commercial data', () => {
  it('freezes the approved identities, prices, limits and policies', () => {
    const artifact = readArtifact();

    expect(artifact.profile).toBe('MVP_LOCAL_36');
    expect(artifact.version).toBe('1.0.0');
    expect(artifact.status).toBe('OWNER_APPROVED_FROZEN');
    expect(artifact.currency).toBe('EUR');
    expect(artifact.commercialActivationAuthorized).toBe(false);
    expect(artifact.pricePolicy).toEqual({
      initialBasis: 'SUM_OF_COMPONENT_SALE_PRICES',
      discountCents: 0,
      automaticRecalculation: false,
    });
    expect(artifact.maxPerOrderPolicy).toEqual({
      initialBasis: 'LIMITING_COMPONENT',
      automaticRecalculation: false,
    });
    expect(artifact.composites.map(({ sku }) => sku)).toEqual([
      'HYA-CMB-001', 'HYA-CMB-002', 'HYA-CMB-003',
      'HYA-CMB-004', 'HYA-CMB-005', 'HYA-CMB-006',
    ]);
    expect(artifact.composites.map(({ name }) => name)).toEqual([
      'Pack Mahou Frío 6 + Hielo 2 kg',
      'Pack Heineken Frío 6 + Hielo 2 kg',
      'Pack Estrella Galicia Frío 6 + Hielo 2 kg',
      'Pack Cruzcampo Frío 6 + Hielo 2 kg',
      'Combo Gin Tonic Larios + Hielo',
      'Combo Vodka Energy Absolut + Hielo',
    ]);
    expect(artifact.composites.map(({ salePriceCents }) => salePriceCents)).toEqual([1193, 1253, 1253, 1133, 3500, 3563]);
    expect(artifact.composites.map(({ maxPerOrder }) => maxPerOrder)).toEqual([4, 4, 4, 4, 3, 3]);
    expect(artifact.composites.every((item) => item.currency === 'EUR'
      && item.containsAlcohol
      && item.minimumAge === 18
      && item.isPack
      && item.iceIncluded
      && item.mvpStatus === 'PAUSED'
      && item.commerciallyActive === false)).toBe(true);
  });

  it('freezes exact component maps without internal stock, cost or margin data', () => {
    const artifact = readArtifact();
    const expectedComponents: Record<string, Record<string, number>> = {
      'HYA-CMB-001': { 'HYA-CER-001': 6, 'HYA-GEL-051': 1 },
      'HYA-CMB-002': { 'HYA-CER-003': 6, 'HYA-GEL-051': 1 },
      'HYA-CMB-003': { 'HYA-CER-006': 6, 'HYA-GEL-051': 1 },
      'HYA-CMB-004': { 'HYA-CER-009': 6, 'HYA-GEL-051': 1 },
      'HYA-CMB-005': { 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 },
      'HYA-CMB-006': { 'HYA-DES-040': 1, 'HYA-ENE-026': 4, 'HYA-GEL-051': 1, 'HYA-CON-059': 1 },
    };
    const unitSkus = new Set(MVP_LOCAL_36_CONTRACT_FIXTURE.filter((item) => item.kind === 'unit').map((item) => item.sku));

    for (const composite of artifact.composites) {
      expect(Object.fromEntries(composite.components.map(({ sku, quantity }) => [sku, quantity]))).toEqual(expectedComponents[composite.sku]);
      expect(composite.components.some(({ sku }) => sku === 'HYA-GEL-051')).toBe(true);
      composite.components.forEach(({ sku }) => expect(unitSkus.has(sku)).toBe(true));
    }

    const keys = new Set<string>();
    collectKeys(artifact, keys);
    expect([...keys].filter((key) => /stock|inventory|reservation|movement|batch|reorder|purchaseCost|costCents|margin/i.test(key))).toEqual([]);
  });

  it('keeps the artifact byte-stable and records its evidence in the ADR', () => {
    const artifact = readFileSync(artifactPath);
    const actualSha256 = createHash('sha256').update(artifact).digest('hex');
    const adr = readFileSync(adrPath, 'utf8');
    const output = execFileSync(process.execPath, ['scripts/validate-mvp-local-36-composite-commercial-data.mjs'], { encoding: 'utf8' });

    expect(actualSha256).toBe(expectedSha256);
    expect(adr).toContain(expectedSha256);
    expect(adr).toContain('SUM_OF_COMPONENT_SALE_PRICES');
    expect(adr).toContain('LIMITING_COMPONENT');
    expect(output).toContain(`CANONICAL_COMPOSITE_SHA256=${expectedSha256}`);
    expect(output).toContain('COMPOSITE_COUNT=6');
    expect(output).toContain('OWNER_APPROVAL_RECORDED=true');
    expect(output).toContain('COMMERCIAL_SKUS_ACTIVATED=0');
    expect(output).toContain('PERSISTENCE_SCHEMA_CHANGED=false');
    expect(output).toContain('PUBLIC_ENDPOINTS_IMPLEMENTED=false');
  });
});
