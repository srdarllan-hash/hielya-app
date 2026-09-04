import { createHash } from 'node:crypto';

import compositeCatalogDocument from '../../../contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json' with { type: 'json' };
import unitCatalogDocument from '../../../contracts/catalog/HIELYA_MVP_LOCAL_36_UNIT_COMMERCIAL_DATA_V1_1.json' with { type: 'json' };

export type MvpStatus = 'PAUSED' | 'DEFERRED_AFTER_MVP';
export type ProductKind = 'UNIT' | 'COMPOSITE';

interface UnitCatalogRecord {
  sku: string;
  name: string;
  category: string;
  salePriceCents: number;
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge: number;
  kind: 'UNIT';
  isPack: false;
  iceIncluded: false;
  mvpStatus: MvpStatus;
  commerciallyActive: false;
}

interface UnitCatalogContract {
  profile: 'MVP_LOCAL_36';
  version: '1.1.0';
  status: 'CANONICAL_XLSX_EXTRACT';
  source: { file: string; sha256: string };
  currency: 'EUR';
  units: UnitCatalogRecord[];
}

interface CompositeComponentContract {
  sku: string;
  quantity: number;
}

interface CompositeCatalogRecord {
  sku: string;
  name: string;
  salePriceCents: number;
  currency: 'EUR';
  maxPerOrder: number;
  containsAlcohol: true;
  minimumAge: 18;
  isPack: true;
  iceIncluded: true;
  mvpStatus: 'PAUSED';
  commerciallyActive: false;
  components: CompositeComponentContract[];
}

interface CompositeCatalogContract {
  profile: 'MVP_LOCAL_36';
  version: '1.0.0';
  status: 'OWNER_APPROVED_FROZEN';
  currency: 'EUR';
  commercialActivationAuthorized: false;
  composites: CompositeCatalogRecord[];
}

export interface SeedProduct {
  sku: string;
  category: string;
  status: MvpStatus;
  kind: ProductKind;
}

export interface CategoryCommercialSeed {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  publicVisible: false;
}

export interface ProductCommercialSeed {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId: string;
  salePriceCents: number;
  currency: 'EUR';
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge: number;
  isPack: boolean;
  iceIncluded: boolean;
  publicVisible: false;
  sortOrder: number;
  kind: ProductKind;
  mvpStatus: MvpStatus;
  commerciallyActive: false;
}

export const UNIT_CATALOG = unitCatalogDocument as unknown as UnitCatalogContract;
export const COMPOSITE_CATALOG = compositeCatalogDocument as unknown as CompositeCatalogContract;

export const UNIT_CATALOG_SOURCE_SHA256 = 'ea0cbd6294973242fa3b9aeda1cbf7c33e5233ff705fc014ac4a9113bd39807a';
export const COMPOSITE_CATALOG_SHA256 = 'c2db49b2f7aa66cf0e75d3bfe18fb34296c40ef836cd0d8354a1993cc7f4d6b7';

export const CATEGORY_NAMES = [
  'Cervejas',
  'Refrigerantes',
  'Energéticos',
  'Águas',
  'Destilados',
  'Vinhos e Espumantes',
  'Gelo',
  'Snacks',
  'Conveniência',
] as const;

export const CATALOG_UUID_NAMESPACE = '33c43b74-2f36-5e8d-9d82-8a6f1b17c8c2';

const uuidBytes = (uuid: string): Buffer => Buffer.from(uuid.replaceAll('-', ''), 'hex');

export const stableCatalogUuid = (scope: 'category' | 'product', key: string): string => {
  const digest = createHash('sha1')
    .update(uuidBytes(CATALOG_UUID_NAMESPACE))
    .update(`${scope}:${key}`, 'utf8')
    .digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const value = digest.subarray(0, 16).toString('hex');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

export const CATEGORY_COMMERCIAL_SEED: readonly CategoryCommercialSeed[] = CATEGORY_NAMES.map((name, sortOrder) => ({
  id: stableCatalogUuid('category', name),
  slug: name,
  name,
  sortOrder,
  publicVisible: false,
}));

const categoryIdBySlug = new Map(CATEGORY_COMMERCIAL_SEED.map((category) => [category.slug, category.id]));

export const SELECTED_EXISTING_SKUS = UNIT_CATALOG.units
  .filter((product) => product.mvpStatus === 'PAUSED')
  .map((product) => product.sku) as readonly string[];

const compositeCategory: Readonly<Record<string, string>> = {
  'HYA-CMB-001': 'Cervejas',
  'HYA-CMB-002': 'Cervejas',
  'HYA-CMB-003': 'Cervejas',
  'HYA-CMB-004': 'Cervejas',
  'HYA-CMB-005': 'Destilados',
  'HYA-CMB-006': 'Destilados',
};

export const BUNDLE_COMPONENTS: Readonly<Record<string, Readonly<Record<string, number>>>> = Object.fromEntries(
  COMPOSITE_CATALOG.composites.map((composite) => [
    composite.sku,
    Object.fromEntries(composite.components.map((component) => [component.sku, component.quantity])),
  ]),
);

export const INITIAL_SEED: readonly SeedProduct[] = [
  ...UNIT_CATALOG.units.map((product) => ({
    sku: product.sku,
    category: product.category,
    status: product.mvpStatus,
    kind: 'UNIT' as const,
  })),
  ...COMPOSITE_CATALOG.composites.map((product) => ({
    sku: product.sku,
    category: compositeCategory[product.sku],
    status: 'PAUSED' as const,
    kind: 'COMPOSITE' as const,
  })),
];

export const PRODUCT_COMMERCIAL_SEED: readonly ProductCommercialSeed[] = [
  ...UNIT_CATALOG.units.map((product, sortOrder) => ({
    id: stableCatalogUuid('product', product.sku),
    sku: product.sku,
    name: product.name,
    category: product.category,
    categoryId: categoryIdBySlug.get(product.category) ?? '',
    salePriceCents: product.salePriceCents,
    currency: 'EUR' as const,
    maxPerOrder: product.maxPerOrder,
    containsAlcohol: product.containsAlcohol,
    minimumAge: product.minimumAge,
    isPack: false,
    iceIncluded: false,
    publicVisible: false as const,
    sortOrder,
    kind: 'UNIT' as const,
    mvpStatus: product.mvpStatus,
    commerciallyActive: false as const,
  })),
  ...COMPOSITE_CATALOG.composites.map((product, index) => {
    const category = compositeCategory[product.sku];
    return {
      id: stableCatalogUuid('product', product.sku),
      sku: product.sku,
      name: product.name,
      category,
      categoryId: categoryIdBySlug.get(category) ?? '',
      salePriceCents: product.salePriceCents,
      currency: 'EUR' as const,
      maxPerOrder: product.maxPerOrder,
      containsAlcohol: product.containsAlcohol,
      minimumAge: product.minimumAge,
      isPack: product.isPack,
      iceIncluded: product.iceIncluded,
      publicVisible: false as const,
      sortOrder: UNIT_CATALOG.units.length + index,
      kind: 'COMPOSITE' as const,
      mvpStatus: 'PAUSED' as const,
      commerciallyActive: false as const,
    };
  }),
];

if (UNIT_CATALOG.source.sha256 !== UNIT_CATALOG_SOURCE_SHA256) {
  throw new Error('Unit catalog source hash does not match the certified Master Package catalog');
}

if (CATEGORY_COMMERCIAL_SEED.some((category) => !category.id)) {
  throw new Error('A canonical category is missing its deterministic identifier');
}

if (PRODUCT_COMMERCIAL_SEED.some((product) => !product.categoryId)) {
  throw new Error('A canonical product is missing its persisted category relationship');
}
