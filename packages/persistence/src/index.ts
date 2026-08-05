import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUNDLE_COMPONENTS,
  CATEGORY_COMMERCIAL_SEED,
  INITIAL_SEED,
  PRODUCT_COMMERCIAL_SEED,
} from './catalog-data';

export {
  BUNDLE_COMPONENTS,
  CATALOG_UUID_NAMESPACE,
  CATEGORY_COMMERCIAL_SEED,
  COMPOSITE_CATALOG,
  COMPOSITE_CATALOG_SHA256,
  INITIAL_SEED,
  PRODUCT_COMMERCIAL_SEED,
  SELECTED_EXISTING_SKUS,
  UNIT_CATALOG,
  UNIT_CATALOG_SOURCE_SHA256,
  stableCatalogUuid,
} from './catalog-data';
export type { ProductCommercialSeed, SeedProduct } from './catalog-data';

type Statement = {
  run: (...args: unknown[]) => unknown;
  get: <T>(...args: unknown[]) => T | undefined;
  all: <T>(...args: unknown[]) => T[];
};

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => Statement;
  close: () => void;
};

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (filename: string) => SqliteDatabase;
};

export type CommercialAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE';

export interface OperationalSettings {
  minimumProductSubtotalCents: number;
  deliveryBaseFeeCents: number;
  deliveryFeePerKmCents: number;
  maximumRoadDistanceKm: number;
  maximumPinAttempts: number;
  tipsEnabled: boolean;
}

export interface PublicCatalogProductDto {
  sku: string;
  availability: CommercialAvailability;
}

export interface InternalInventoryDto {
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

export interface PublicCategoryReadModel {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  publicVisible: boolean;
}

export interface PublicBundleComponentReadModel {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface PublicProductReadModel {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  salePriceCents: number;
  currency: 'EUR';
  availability: CommercialAvailability;
  isPack: boolean;
  iceIncluded: boolean;
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge: number | null;
  bundleComponents: PublicBundleComponentReadModel[];
}

export interface PersistentProductCatalogRecord {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categorySlug: string;
  salePriceCents: number;
  currency: 'EUR';
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge: number;
  isPack: boolean;
  iceIncluded: boolean;
  kind: 'UNIT' | 'COMPOSITE';
  mvpStatus: 'PAUSED' | 'DEFERRED_AFTER_MVP';
  commerciallyActive: boolean;
  publicVisible: boolean;
  sortOrder: number;
}

interface ProductCatalogRow {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  category_slug: string;
  sale_price_cents: number;
  currency: 'EUR';
  max_per_order: number;
  contains_alcohol: number;
  minimum_age: number;
  is_pack: number;
  ice_included: number;
  kind: 'UNIT' | 'COMPOSITE';
  mvp_status: 'PAUSED' | 'DEFERRED_AFTER_MVP';
  commercially_active: number;
  public_visible: number;
  sort_order: number;
}

interface CategoryCatalogRow {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: number;
  public_visible: number;
}

export const DEVELOPMENT_MIGRATIONS = [
  '0001_mvp_local_36_persistence.sql',
  '0002_mvp_local_36_catalog_read_model.sql',
] as const;

export const resolveDevelopmentMigrationDirectory = (moduleUrl: string): string => moduleUrl.startsWith('file:')
  ? fileURLToPath(new URL('../../../.dev-migrations/', moduleUrl))
  : resolve(process.cwd(), '.dev-migrations');

export const resolveDevelopmentMigrationPath = (
  moduleUrl: string,
  filename: string = DEVELOPMENT_MIGRATIONS[0],
): string => resolve(resolveDevelopmentMigrationDirectory(moduleUrl), filename);

const row = <T>(db: SqliteDatabase, sql: string, ...args: unknown[]): T | undefined => (
  db.prepare(sql).get<T>(...args)
);

const rows = <T>(db: SqliteDatabase, sql: string, ...args: unknown[]): T[] => (
  db.prepare(sql).all<T>(...args)
);

const productSelect = `
  SELECT
    commercial.id,
    product.sku,
    commercial.name,
    commercial.category_id,
    product.category_slug,
    commercial.sale_price_cents,
    commercial.currency,
    commercial.max_per_order,
    commercial.contains_alcohol,
    commercial.minimum_age,
    commercial.is_pack,
    commercial.ice_included,
    product.kind,
    product.mvp_status,
    product.commercially_active,
    commercial.public_visible,
    commercial.sort_order
  FROM products product
  JOIN product_commercial_data commercial ON commercial.product_sku = product.sku
`;

const mapProductRecord = (value: ProductCatalogRow): PersistentProductCatalogRecord => ({
  id: value.id,
  sku: value.sku,
  name: value.name,
  categoryId: value.category_id,
  categorySlug: value.category_slug,
  salePriceCents: value.sale_price_cents,
  currency: value.currency,
  maxPerOrder: value.max_per_order,
  containsAlcohol: value.contains_alcohol === 1,
  minimumAge: value.minimum_age,
  isPack: value.is_pack === 1,
  iceIncluded: value.ice_included === 1,
  kind: value.kind,
  mvpStatus: value.mvp_status,
  commerciallyActive: value.commercially_active === 1,
  publicVisible: value.public_visible === 1,
  sortOrder: value.sort_order,
});

export class MvpPersistenceDatabase {
  readonly db: SqliteDatabase;
  private readonly migrationDirectory: string;

  constructor(
    filename = ':memory:',
    migrationDirectory = resolveDevelopmentMigrationDirectory(import.meta.url),
  ) {
    this.db = new DatabaseSync(filename);
    this.migrationDirectory = migrationDirectory;
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS development_schema_migrations (
        version TEXT PRIMARY KEY,
        sha256 TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const filename of DEVELOPMENT_MIGRATIONS) {
      const source = readFileSync(resolve(this.migrationDirectory, filename), 'utf8');
      const sha256 = createHash('sha256').update(source).digest('hex');
      const applied = row<{ sha256: string }>(
        this.db,
        'SELECT sha256 FROM development_schema_migrations WHERE version = ?',
        filename,
      );
      if (applied) {
        if (applied.sha256 !== sha256) throw new Error(`development migration checksum mismatch: ${filename}`);
        continue;
      }
      this.transaction(() => {
        this.db.exec(source);
        this.db.prepare(
          'INSERT INTO development_schema_migrations (version,sha256) VALUES (?,?)',
        ).run(filename, sha256);
      });
    }
  }

  close(): void {
    this.db.close();
  }

  transaction<T>(action: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const value = action();
      this.db.exec('COMMIT');
      return value;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private writeSettings(settings: OperationalSettings): void {
    this.db.prepare(`
      INSERT INTO operational_settings (
        id,
        minimum_product_subtotal_cents,
        delivery_base_fee_cents,
        delivery_fee_per_km_cents,
        maximum_road_distance_km,
        maximum_pin_attempts,
        tips_enabled
      ) VALUES (1,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        minimum_product_subtotal_cents = excluded.minimum_product_subtotal_cents,
        delivery_base_fee_cents = excluded.delivery_base_fee_cents,
        delivery_fee_per_km_cents = excluded.delivery_fee_per_km_cents,
        maximum_road_distance_km = excluded.maximum_road_distance_km,
        maximum_pin_attempts = excluded.maximum_pin_attempts,
        tips_enabled = excluded.tips_enabled,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      settings.minimumProductSubtotalCents,
      settings.deliveryBaseFeeCents,
      settings.deliveryFeePerKmCents,
      settings.maximumRoadDistanceKm,
      settings.maximumPinAttempts,
      settings.tipsEnabled ? 1 : 0,
    );
  }

  seed(settings: OperationalSettings): void {
    this.transaction(() => {
      for (const category of CATEGORY_COMMERCIAL_SEED) {
        this.db.prepare(
          'INSERT OR IGNORE INTO categories (slug,name_es,sort_order) VALUES (?,?,?)',
        ).run(category.slug, category.name, category.sortOrder);
        this.db.prepare(`
          INSERT OR IGNORE INTO category_commercial_data (
            category_slug,id,public_visible
          ) VALUES (?,?,?)
        `).run(category.slug, category.id, category.publicVisible ? 1 : 0);
      }

      for (const product of INITIAL_SEED) {
        this.db.prepare(`
          INSERT OR IGNORE INTO products (sku,category_slug,kind,mvp_status)
          VALUES (?,?,?,?)
        `).run(product.sku, product.category, product.kind, product.status);
      }

      for (const product of PRODUCT_COMMERCIAL_SEED) {
        this.db.prepare(`
          INSERT OR IGNORE INTO product_commercial_data (
            product_sku,id,category_id,name,sale_price_cents,currency,
            max_per_order,contains_alcohol,minimum_age,is_pack,ice_included,
            public_visible,sort_order
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          product.sku,
          product.id,
          product.categoryId,
          product.name,
          product.salePriceCents,
          product.currency,
          product.maxPerOrder,
          product.containsAlcohol ? 1 : 0,
          product.minimumAge,
          product.isPack ? 1 : 0,
          product.iceIncluded ? 1 : 0,
          product.publicVisible ? 1 : 0,
          product.sortOrder,
        );
      }

      for (const [bundleSku, components] of Object.entries(BUNDLE_COMPONENTS)) {
        this.db.prepare('INSERT OR IGNORE INTO product_bundles (product_sku) VALUES (?)').run(bundleSku);
        for (const [componentSku, quantity] of Object.entries(components)) {
          this.db.prepare(`
            INSERT OR IGNORE INTO product_bundle_components (
              bundle_sku,component_sku,quantity
            ) VALUES (?,?,?)
          `).run(bundleSku, componentSku, quantity);
        }
      }

      this.writeSettings(settings);
    });
  }

  settings(): OperationalSettings {
    const value = row<{
      minimum_product_subtotal_cents: number;
      delivery_base_fee_cents: number;
      delivery_fee_per_km_cents: number;
      maximum_road_distance_km: number;
      maximum_pin_attempts: number;
      tips_enabled: number;
    }>(this.db, 'SELECT * FROM operational_settings WHERE id = 1');
    if (!value) throw new Error('operational settings missing');
    return {
      minimumProductSubtotalCents: value.minimum_product_subtotal_cents,
      deliveryBaseFeeCents: value.delivery_base_fee_cents,
      deliveryFeePerKmCents: value.delivery_fee_per_km_cents,
      maximumRoadDistanceKm: value.maximum_road_distance_km,
      maximumPinAttempts: value.maximum_pin_attempts,
      tipsEnabled: value.tips_enabled === 1,
    };
  }

  getOperationalSettings(): OperationalSettings {
    return this.settings();
  }

  updateSettings(settings: OperationalSettings): void {
    this.transaction(() => this.writeSettings(settings));
  }

  adjustInventory(sku: string, delta: number, reason = 'ADJUSTMENT'): void {
    this.transaction(() => {
      const current = row<{ quantity_on_hand: number }>(
        this.db,
        'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku = ?',
        sku,
      )?.quantity_on_hand ?? 0;
      const next = current + delta;
      if (next < 0) throw new Error('negative inventory is prohibited');
      this.db.prepare(`
        INSERT INTO inventory_balances (product_sku,quantity_on_hand)
        VALUES (?,?)
        ON CONFLICT(product_sku) DO UPDATE SET
          quantity_on_hand = excluded.quantity_on_hand,
          updated_at = CURRENT_TIMESTAMP
      `).run(sku, next);
      this.db.prepare(`
        INSERT INTO inventory_movements (
          movement_id,product_sku,delta_quantity,quantity_after,reason,correlation_id
        ) VALUES (?,?,?,?,?,?)
      `).run(randomUUID(), sku, delta, next, reason, randomUUID());
    });
  }

  internalInventory(sku: string): InternalInventoryDto {
    const onHand = row<{ quantity_on_hand: number }>(
      this.db,
      'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku = ?',
      sku,
    )?.quantity_on_hand ?? 0;
    const reserved = row<{ total: number }>(this.db, `
      SELECT COALESCE(SUM(item.quantity),0) AS total
      FROM inventory_reservation_items item
      JOIN inventory_reservations reservation
        ON reservation.reservation_id = item.reservation_id
      WHERE reservation.status = 'ACTIVE' AND item.product_sku = ?
    `, sku)?.total ?? 0;
    return {
      sku,
      quantityOnHand: onHand,
      quantityReserved: reserved,
      quantityAvailable: onHand - reserved,
    };
  }

  reserveBundle(bundleSku: string, referenceId: string): string {
    return this.transaction(() => {
      const components = rows<{ component_sku: string; quantity: number }>(
        this.db,
        'SELECT component_sku,quantity FROM product_bundle_components WHERE bundle_sku=?',
        bundleSku,
      );
      if (!components.length) throw new Error('bundle components missing');
      for (const component of components) {
        if (this.internalInventory(component.component_sku).quantityAvailable < component.quantity) {
          throw new Error(`component unavailable: ${component.component_sku}`);
        }
      }
      const reservationId = randomUUID();
      this.db.prepare(`
        INSERT INTO inventory_reservations (reservation_id,reference_id,status)
        VALUES (?,?,'ACTIVE')
      `).run(reservationId, referenceId);
      for (const component of components) {
        this.db.prepare(`
          INSERT INTO inventory_reservation_items (reservation_id,product_sku,quantity)
          VALUES (?,?,?)
        `).run(reservationId, component.component_sku, component.quantity);
      }
      return reservationId;
    });
  }

  publicCatalogDto(sku: string): PublicCatalogProductDto {
    const product = row<{ kind: string }>(this.db, 'SELECT kind FROM products WHERE sku=?', sku);
    if (!product) throw new Error('product missing');
    if (product.kind === 'COMPOSITE') {
      const components = rows<{ component_sku: string; quantity: number }>(
        this.db,
        'SELECT component_sku,quantity FROM product_bundle_components WHERE bundle_sku=?',
        sku,
      );
      return {
        sku,
        availability: components.length > 0 && components.every((component) => (
          this.internalInventory(component.component_sku).quantityAvailable >= component.quantity
        )) ? 'AVAILABLE' : 'UNAVAILABLE',
      };
    }
    return {
      sku,
      availability: this.internalInventory(sku).quantityAvailable > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
    };
  }

  getCommercialAvailability(sku: string): CommercialAvailability {
    return this.publicCatalogDto(sku).availability;
  }

  listCategoriesInDisplayOrder(): PublicCategoryReadModel[] {
    return rows<CategoryCatalogRow>(this.db, `
      SELECT
        commercial.id,
        category.slug,
        category.name_es AS name,
        category.sort_order,
        category.is_active,
        commercial.public_visible
      FROM categories category
      JOIN category_commercial_data commercial
        ON commercial.category_slug = category.slug
      ORDER BY category.sort_order, category.slug
    `).map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      sortOrder: category.sort_order,
      isActive: category.is_active === 1,
      publicVisible: category.public_visible === 1,
    }));
  }

  findCategoryById(id: string): PublicCategoryReadModel | undefined {
    const category = row<CategoryCatalogRow>(this.db, `
      SELECT
        commercial.id,
        category.slug,
        category.name_es AS name,
        category.sort_order,
        category.is_active,
        commercial.public_visible
      FROM categories category
      JOIN category_commercial_data commercial
        ON commercial.category_slug = category.slug
      WHERE commercial.id = ?
    `, id);
    if (!category) return undefined;
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      sortOrder: category.sort_order,
      isActive: category.is_active === 1,
      publicVisible: category.public_visible === 1,
    };
  }

  listMvpCatalogRecords(): PersistentProductCatalogRecord[] {
    return rows<ProductCatalogRow>(this.db, `
      ${productSelect}
      JOIN category_commercial_data category_commercial
        ON category_commercial.id = commercial.category_id
      JOIN categories category ON category.slug = category_commercial.category_slug
      WHERE product.mvp_status = 'PAUSED'
      ORDER BY category.sort_order, commercial.sort_order, product.sku
    `).map(mapProductRecord);
  }

  findProductById(id: string): PersistentProductCatalogRecord | undefined {
    const product = row<ProductCatalogRow>(this.db, `${productSelect} WHERE commercial.id = ?`, id);
    return product ? mapProductRecord(product) : undefined;
  }

  findProductBySku(sku: string): PersistentProductCatalogRecord | undefined {
    const product = row<ProductCatalogRow>(this.db, `${productSelect} WHERE product.sku = ?`, sku);
    return product ? mapProductRecord(product) : undefined;
  }

  resolveBundleComponents(bundleSku: string): PublicBundleComponentReadModel[] {
    return rows<{
      product_id: string;
      sku: string;
      name: string;
      quantity: number;
    }>(this.db, `
      SELECT
        commercial.id AS product_id,
        component.component_sku AS sku,
        commercial.name,
        component.quantity
      FROM product_bundle_components component
      JOIN product_commercial_data commercial
        ON commercial.product_sku = component.component_sku
      WHERE component.bundle_sku = ?
      ORDER BY component.rowid
    `, bundleSku).map((component) => ({
      productId: component.product_id,
      sku: component.sku,
      name: component.name,
      quantity: component.quantity,
    }));
  }

  private publicProduct(record: PersistentProductCatalogRecord): PublicProductReadModel {
    return {
      id: record.id,
      sku: record.sku,
      name: record.name,
      categoryId: record.categoryId,
      salePriceCents: record.salePriceCents,
      currency: record.currency,
      availability: this.getCommercialAvailability(record.sku),
      isPack: record.isPack,
      iceIncluded: record.iceIncluded,
      maxPerOrder: record.maxPerOrder,
      containsAlcohol: record.containsAlcohol,
      minimumAge: record.containsAlcohol ? record.minimumAge : null,
      bundleComponents: record.isPack ? this.resolveBundleComponents(record.sku) : [],
    };
  }

  listPubliclyEligibleProducts(): PublicProductReadModel[] {
    return rows<ProductCatalogRow>(this.db, `
      ${productSelect}
      JOIN category_commercial_data category_commercial
        ON category_commercial.id = commercial.category_id
      JOIN categories category ON category.slug = category_commercial.category_slug
      WHERE product.mvp_status = 'PAUSED'
        AND product.commercially_active = 1
        AND commercial.public_visible = 1
        AND category.is_active = 1
        AND category_commercial.public_visible = 1
      ORDER BY category.sort_order, commercial.sort_order, product.sku
    `).map(mapProductRecord).map((product) => this.publicProduct(product));
  }

  createDeliveryPin(orderReference: string, pin: string): void {
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN must contain four digits');
    this.db.prepare(`
      INSERT OR REPLACE INTO delivery_pins (order_reference,pin_hash,attempts_used)
      VALUES (?,?,0)
    `).run(orderReference, createHash('sha256').update(pin).digest('hex'));
  }

  verifyDeliveryPin(orderReference: string, pin: string): boolean {
    return this.transaction(() => {
      const record = row<{ pin_hash: string; attempts_used: number }>(
        this.db,
        'SELECT pin_hash,attempts_used FROM delivery_pins WHERE order_reference=?',
        orderReference,
      );
      if (!record) return false;
      const limit = this.settings().maximumPinAttempts;
      if (record.attempts_used >= limit) return false;
      const matches = record.pin_hash === createHash('sha256').update(pin).digest('hex');
      this.db.prepare(`
        UPDATE delivery_pins
        SET attempts_used = attempts_used + 1,
            verified_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE verified_at END
        WHERE order_reference = ?
      `).run(matches ? 1 : 0, orderReference);
      return matches;
    });
  }

  quoteDelivery(distanceKm: number): { eligible: boolean; feeCents: number | null } {
    const settings = this.settings();
    if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > settings.maximumRoadDistanceKm) {
      return { eligible: false, feeCents: null };
    }
    return {
      eligible: true,
      feeCents: Math.round(settings.deliveryBaseFeeCents + settings.deliveryFeePerKmCents * distanceKm),
    };
  }

  remainingForMinimum(productSubtotalCents: number): number {
    return Math.max(0, this.settings().minimumProductSubtotalCents - productSubtotalCents);
  }
}
