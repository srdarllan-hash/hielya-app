import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import type { CustomerAuthenticationPolicy } from '../../application/src/auth';

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
export { SqliteCustomerAuthenticationRepository } from './customer-auth';
export type { CustomerAuthenticationPolicy } from '../../application/src/auth';

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

export interface MvpPersistenceDatabaseOptions {
  readOnly?: boolean;
}

export type CommercialAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE';

export interface OperationalSettings {
  minimumProductSubtotalCents: number;
  deliveryBaseFeeCents: number;
  deliveryFeePerKmCents: number;
  maximumRoadDistanceKm: number;
  maximumPinAttempts: number;
  tipsEnabled: boolean;
  inventoryReservationTtlSeconds: number;
}


export type OperationalSettingsInput = Omit<OperationalSettings, 'inventoryReservationTtlSeconds'> & {
  inventoryReservationTtlSeconds?: number;
};

export type ReservationStatus = 'ACTIVE' | 'RELEASED' | 'CONVERTED';
export type ReservationReleaseReason = 'MANUAL' | 'EXPIRED';

export interface ReserveInventoryItem {
  productSku: string;
  quantity: number;
}

export interface ReserveInventoryInput {
  referenceId: string;
  items: readonly ReserveInventoryItem[];
  now?: Date | string;
}

export interface InventoryReservationItemReadModel {
  productSku: string;
  quantity: number;
}

export interface InventoryReservationReadModel {
  reservationId: string;
  referenceId: string;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  releasedAt: string | null;
  convertedAt: string | null;
  releaseReason: ReservationReleaseReason | null;
  requestFingerprint: string;
  updatedAt: string;
  items: InventoryReservationItemReadModel[];
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

interface ReservationRow {
  reservation_id: string;
  reference_id: string;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
  released_at: string | null;
  converted_at: string | null;
  release_reason: ReservationReleaseReason | null;
  request_fingerprint: string;
  updated_at: string;
}

interface RequestedProductRow {
  sku: string;
  kind: 'UNIT' | 'COMPOSITE';
}

export const REQUEST_FINGERPRINT_PREFIX = 'request-v1:';
export const LEGACY_FINGERPRINT_PREFIX = 'legacy-v1:';
export const DEFAULT_INVENTORY_RESERVATION_TTL_SECONDS = 600;

const utcTimestamp = (value: Date | string = new Date()): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('invalid reservation timestamp');
  return date.toISOString();
};

const plusSeconds = (timestamp: string, seconds: number): string => (
  new Date(new Date(timestamp).getTime() + seconds * 1_000).toISOString()
);

const normalizeRequestedItems = (
  items: readonly ReserveInventoryItem[],
): ReserveInventoryItem[] => {
  if (!Array.isArray(items) || items.length === 0) throw new Error('reservation items are required');
  const normalized = new Map<string, number>();
  for (const item of items) {
    const productSku = typeof item?.productSku === 'string' ? item.productSku.trim() : '';
    if (!productSku) throw new Error('reservation product SKU is required');
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('reservation quantity must be a positive integer');
    }
    const quantity = (normalized.get(productSku) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new Error('reservation quantity is outside the safe integer range');
    normalized.set(productSku, quantity);
  }
  return [...normalized.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([productSku, quantity]) => ({ productSku, quantity }));
};

const requestFingerprint = (items: readonly ReserveInventoryItem[]): string => (
  `${REQUEST_FINGERPRINT_PREFIX}${createHash('sha256').update(JSON.stringify(items)).digest('hex')}`
);

export const DEVELOPMENT_MIGRATIONS = [
  '0001_mvp_local_36_persistence.sql',
  '0002_mvp_local_36_catalog_read_model.sql',
  '0003_mvp_local_36_inventory_reservation_lifecycle.sql',
  '0004_mvp_local_36_customer_authentication_foundation.sql',
  '0005_mvp_local_36_order_delivery_foundation.sql',
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
  private transactionDepth = 0;

  constructor(
    filename = ':memory:',
    migrationDirectory = resolveDevelopmentMigrationDirectory(import.meta.url),
    options: MvpPersistenceDatabaseOptions = {},
  ) {
    this.db = new DatabaseSync(filename, { readOnly: options.readOnly }) as unknown as SqliteDatabase;
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
    const depth = this.transactionDepth++;
    const savepoint = `hielya_nested_${depth}`;
    try {
      this.db.exec(depth === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${savepoint}`);
      try {
        const value = action();
        this.db.exec(depth === 0 ? 'COMMIT' : `RELEASE SAVEPOINT ${savepoint}`);
        return value;
      } catch (error) {
        this.db.exec(depth === 0 ? 'ROLLBACK' : `ROLLBACK TO SAVEPOINT ${savepoint}`);
        if (depth !== 0) this.db.exec(`RELEASE SAVEPOINT ${savepoint}`);
        throw error;
      }
    } finally { this.transactionDepth -= 1; }
  }

  private writeSettings(settings: OperationalSettingsInput): void {
    const inventoryReservationTtlSeconds = settings.inventoryReservationTtlSeconds
      ?? row<{ inventory_reservation_ttl_seconds: number }>(
        this.db,
        'SELECT inventory_reservation_ttl_seconds FROM operational_settings WHERE id=1',
      )?.inventory_reservation_ttl_seconds
      ?? DEFAULT_INVENTORY_RESERVATION_TTL_SECONDS;
    if (!Number.isInteger(inventoryReservationTtlSeconds) || inventoryReservationTtlSeconds <= 0) {
      throw new Error('inventory reservation TTL must be a positive integer');
    }
    this.db.prepare(`
      INSERT INTO operational_settings (
        id,
        minimum_product_subtotal_cents,
        delivery_base_fee_cents,
        delivery_fee_per_km_cents,
        maximum_road_distance_km,
        maximum_pin_attempts,
        tips_enabled,
        inventory_reservation_ttl_seconds
      ) VALUES (1,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        minimum_product_subtotal_cents = excluded.minimum_product_subtotal_cents,
        delivery_base_fee_cents = excluded.delivery_base_fee_cents,
        delivery_fee_per_km_cents = excluded.delivery_fee_per_km_cents,
        maximum_road_distance_km = excluded.maximum_road_distance_km,
        maximum_pin_attempts = excluded.maximum_pin_attempts,
        tips_enabled = excluded.tips_enabled,
        inventory_reservation_ttl_seconds = excluded.inventory_reservation_ttl_seconds,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      settings.minimumProductSubtotalCents,
      settings.deliveryBaseFeeCents,
      settings.deliveryFeePerKmCents,
      settings.maximumRoadDistanceKm,
      settings.maximumPinAttempts,
      settings.tipsEnabled ? 1 : 0,
      inventoryReservationTtlSeconds,
    );
  }

  seed(settings: OperationalSettingsInput): void {
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
      inventory_reservation_ttl_seconds: number;
    }>(this.db, 'SELECT * FROM operational_settings WHERE id = 1');
    if (!value) throw new Error('operational settings missing');
    return {
      minimumProductSubtotalCents: value.minimum_product_subtotal_cents,
      deliveryBaseFeeCents: value.delivery_base_fee_cents,
      deliveryFeePerKmCents: value.delivery_fee_per_km_cents,
      maximumRoadDistanceKm: value.maximum_road_distance_km,
      maximumPinAttempts: value.maximum_pin_attempts,
      tipsEnabled: value.tips_enabled === 1,
      inventoryReservationTtlSeconds: value.inventory_reservation_ttl_seconds,
    };
  }

  customerAuthenticationPolicy(): CustomerAuthenticationPolicy {
    const value = row<{
      phone_scope: 'ES';
      country_calling_code: '+34';
      national_number_length: 9;
      otp_length: 6;
      otp_ttl_seconds: number;
      otp_resend_cooldown_seconds: number;
      otp_max_verification_attempts: number;
      sms_provider: 'SIMULATED';
      customer_session_ttl_seconds: number;
      customer_session_expiry_mode: 'ABSOLUTE';
      public_browsing_requires_login: number;
      checkout_requires_login: number;
    }>(this.db, 'SELECT * FROM operational_settings WHERE id = 1');
    if (!value) throw new Error('operational settings missing');
    if (value.public_browsing_requires_login !== 0 || value.checkout_requires_login !== 1) {
      throw new Error('customer authentication access policy is invalid');
    }
    return {
      phoneScope: value.phone_scope,
      countryCallingCode: value.country_calling_code,
      nationalNumberLength: value.national_number_length,
      otpLength: value.otp_length,
      otpTtlSeconds: value.otp_ttl_seconds,
      otpResendCooldownSeconds: value.otp_resend_cooldown_seconds,
      otpMaxVerificationAttempts: value.otp_max_verification_attempts,
      smsProvider: value.sms_provider,
      customerSessionTtlSeconds: value.customer_session_ttl_seconds,
      customerSessionExpiryMode: value.customer_session_expiry_mode,
      publicBrowsingRequiresLogin: false,
      checkoutRequiresLogin: true,
    };
  }

  getOperationalSettings(): OperationalSettings {
    return this.settings();
  }

  updateSettings(settings: OperationalSettingsInput): void {
    this.transaction(() => this.writeSettings(settings));
  }

  private activeReservedQuantity(sku: string, now: string): number {
    const total = row<{ total: number }>(this.db, `
      SELECT COALESCE(SUM(item.quantity),0) AS total
      FROM inventory_reservation_items item
      JOIN inventory_reservations reservation
        ON reservation.reservation_id = item.reservation_id
      WHERE reservation.status = 'ACTIVE'
        AND reservation.expires_at > ?
        AND item.product_sku = ?
    `, now, sku)?.total ?? 0;
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('active reservation invariant violated');
    return total;
  }

  getActiveReservedQuantity(sku: string, now: Date | string = new Date()): number {
    return this.activeReservedQuantity(sku, utcTimestamp(now));
  }

  adjustInventory(
    sku: string,
    delta: number,
    reason = 'ADJUSTMENT',
    now: Date | string = new Date(),
  ): void {
    if (!Number.isInteger(delta) || delta === 0) throw new Error('inventory delta must be a non-zero integer');
    const productSku = sku.trim();
    if (!productSku) throw new Error('inventory product SKU is required');
    const timestamp = utcTimestamp(now);
    this.transaction(() => {
      const product = row<RequestedProductRow>(
        this.db,
        'SELECT sku,kind FROM products WHERE sku = ?',
        productSku,
      );
      if (!product) throw new Error(`product missing: ${productSku}`);
      if (product.kind === 'COMPOSITE') throw new Error('composite products have no independent inventory');
      const current = row<{ quantity_on_hand: number }>(
        this.db,
        'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku = ?',
        productSku,
      )?.quantity_on_hand ?? 0;
      const next = current + delta;
      if (!Number.isSafeInteger(next) || next < 0) throw new Error('negative inventory is prohibited');
      const activeReserved = this.activeReservedQuantity(productSku, timestamp);
      if (next < activeReserved) throw new Error('inventory adjustment would fall below active reservations');
      this.db.prepare(`
        INSERT INTO inventory_balances (product_sku,quantity_on_hand,updated_at)
        VALUES (?,?,?)
        ON CONFLICT(product_sku) DO UPDATE SET
          quantity_on_hand = excluded.quantity_on_hand,
          updated_at = excluded.updated_at
      `).run(productSku, next, timestamp);
      this.db.prepare(`
        INSERT INTO inventory_movements (
          movement_id,product_sku,delta_quantity,quantity_after,reason,
          correlation_id,created_at,reservation_id
        ) VALUES (?,?,?,?,?,?,?,NULL)
      `).run(randomUUID(), productSku, delta, next, reason, randomUUID(), timestamp);
    });
  }

  internalInventory(sku: string, now: Date | string = new Date()): InternalInventoryDto {
    const timestamp = utcTimestamp(now);
    const onHand = row<{ quantity_on_hand: number }>(
      this.db,
      'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku = ?',
      sku,
    )?.quantity_on_hand ?? 0;
    const reserved = this.activeReservedQuantity(sku, timestamp);
    const available = onHand - reserved;
    if (!Number.isSafeInteger(onHand) || onHand < 0 || available < 0) {
      throw new Error('inventory availability invariant violated');
    }
    return {
      sku,
      quantityOnHand: onHand,
      quantityReserved: reserved,
      quantityAvailable: available,
    };
  }

  private reservationItems(reservationId: string): InventoryReservationItemReadModel[] {
    return rows<{ product_sku: string; quantity: number }>(this.db, `
      SELECT product_sku,quantity
      FROM inventory_reservation_items
      WHERE reservation_id = ?
      ORDER BY product_sku
    `, reservationId).map((item) => ({
      productSku: item.product_sku,
      quantity: item.quantity,
    }));
  }

  private reservationRecord(value: ReservationRow): InventoryReservationReadModel {
    return {
      reservationId: value.reservation_id,
      referenceId: value.reference_id,
      status: value.status,
      createdAt: value.created_at,
      expiresAt: value.expires_at,
      releasedAt: value.released_at,
      convertedAt: value.converted_at,
      releaseReason: value.release_reason,
      requestFingerprint: value.request_fingerprint,
      updatedAt: value.updated_at,
      items: this.reservationItems(value.reservation_id),
    };
  }

  findReservationById(reservationId: string): InventoryReservationReadModel | undefined {
    const value = row<ReservationRow>(
      this.db,
      'SELECT * FROM inventory_reservations WHERE reservation_id = ?',
      reservationId,
    );
    return value ? this.reservationRecord(value) : undefined;
  }

  findReservationByReferenceId(referenceId: string): InventoryReservationReadModel | undefined {
    const value = row<ReservationRow>(
      this.db,
      'SELECT * FROM inventory_reservations WHERE reference_id = ?',
      referenceId,
    );
    return value ? this.reservationRecord(value) : undefined;
  }

  private expandRequestedItems(items: readonly ReserveInventoryItem[]): InventoryReservationItemReadModel[] {
    const expanded = new Map<string, number>();
    const add = (productSku: string, quantity: number) => {
      const total = (expanded.get(productSku) ?? 0) + quantity;
      if (!Number.isSafeInteger(total) || total <= 0) {
        throw new Error('expanded reservation quantity is invalid');
      }
      expanded.set(productSku, total);
    };

    for (const item of items) {
      const product = row<RequestedProductRow>(
        this.db,
        'SELECT sku,kind FROM products WHERE sku = ?',
        item.productSku,
      );
      if (!product) throw new Error(`product missing: ${item.productSku}`);
      if (product.kind === 'UNIT') {
        add(product.sku, item.quantity);
        continue;
      }
      const components = rows<{
        component_sku: string;
        quantity: number;
        kind: 'UNIT' | 'COMPOSITE';
      }>(this.db, `
        SELECT component.component_sku,component.quantity,product.kind
        FROM product_bundle_components component
        JOIN products product ON product.sku = component.component_sku
        WHERE component.bundle_sku = ?
        ORDER BY component.component_sku
      `, product.sku);
      if (!components.length) throw new Error(`bundle components missing: ${product.sku}`);
      for (const component of components) {
        if (component.kind !== 'UNIT'
          || !Number.isInteger(component.quantity)
          || component.quantity <= 0) {
          throw new Error(`bundle component invalid: ${component.component_sku}`);
        }
        const quantity = component.quantity * item.quantity;
        if (!Number.isSafeInteger(quantity)) throw new Error('expanded reservation quantity is invalid');
        add(component.component_sku, quantity);
      }
    }

    return [...expanded.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([productSku, quantity]) => ({ productSku, quantity }));
  }

  private legacyOperationalReplayMatches(
    reservation: InventoryReservationReadModel,
    expandedItems: readonly InventoryReservationItemReadModel[],
  ): boolean {
    if (!reservation.requestFingerprint.startsWith(LEGACY_FINGERPRINT_PREFIX)) return false;
    return JSON.stringify(reservation.items) === JSON.stringify(expandedItems);
  }

  private reserveInventoryInternal(
    input: ReserveInventoryInput,
    allowLegacyOperationalReplay: boolean,
  ): InventoryReservationReadModel {
    const referenceId = typeof input.referenceId === 'string' ? input.referenceId.trim() : '';
    if (!referenceId) throw new Error('reservation reference is required');
    const requestedItems = normalizeRequestedItems(input.items);
    const fingerprint = requestFingerprint(requestedItems);
    const timestamp = utcTimestamp(input.now);

    return this.transaction(() => {
      const existing = this.findReservationByReferenceId(referenceId);
      if (existing) {
        if (existing.requestFingerprint === fingerprint) return existing;
        if (!allowLegacyOperationalReplay
          || requestedItems.length !== 1
          || requestedItems[0].quantity !== 1) {
          throw new Error('reservation reference conflicts with a different request fingerprint');
        }
        const legacyExpandedItems = this.expandRequestedItems(requestedItems);
        if (this.legacyOperationalReplayMatches(existing, legacyExpandedItems)) return existing;
        throw new Error('reservation reference conflicts with a different request fingerprint');
      }

      const expandedItems = this.expandRequestedItems(requestedItems);
      for (const item of expandedItems) {
        const inventory = this.internalInventory(item.productSku, timestamp);
        if (inventory.quantityAvailable < item.quantity) {
          throw new Error(`component unavailable: ${item.productSku}`);
        }
      }

      const ttlSeconds = this.settings().inventoryReservationTtlSeconds;
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new Error('inventory reservation TTL is invalid');
      }
      const reservationId = randomUUID();
      const expiresAt = plusSeconds(timestamp, ttlSeconds);
      this.db.prepare(`
        INSERT INTO inventory_reservations (
          reservation_id,reference_id,status,created_at,expires_at,released_at,
          converted_at,release_reason,request_fingerprint,updated_at
        ) VALUES (?,?,'ACTIVE',?,?,NULL,NULL,NULL,?,?)
      `).run(reservationId, referenceId, timestamp, expiresAt, fingerprint, timestamp);
      for (const item of expandedItems) {
        this.db.prepare(`
          INSERT INTO inventory_reservation_items (reservation_id,product_sku,quantity)
          VALUES (?,?,?)
        `).run(reservationId, item.productSku, item.quantity);
      }
      const created = this.findReservationById(reservationId);
      if (!created) throw new Error('reservation creation failed');
      return created;
    });
  }

  reserveInventory(input: ReserveInventoryInput): InventoryReservationReadModel {
    return this.reserveInventoryInternal(input, false);
  }

  reserveBundle(bundleSku: string, referenceId: string, now: Date | string = new Date()): string {
    return this.reserveInventoryInternal({
      referenceId,
      items: [{ productSku: bundleSku, quantity: 1 }],
      now,
    }, true).reservationId;
  }

  releaseReservation(
    reservationId: string,
    reason: 'MANUAL' = 'MANUAL',
    now: Date | string = new Date(),
  ): InventoryReservationReadModel {
    const timestamp = utcTimestamp(now);
    return this.transaction(() => {
      const reservation = this.findReservationById(reservationId);
      if (!reservation) throw new Error('reservation missing');
      if (reservation.status !== 'ACTIVE') return reservation;
      const releaseReason: ReservationReleaseReason = reservation.expiresAt <= timestamp
        ? 'EXPIRED'
        : reason;
      this.db.prepare(`
        UPDATE inventory_reservations
        SET status='RELEASED',released_at=?,release_reason=?,updated_at=?
        WHERE reservation_id=? AND status='ACTIVE'
      `).run(timestamp, releaseReason, timestamp, reservationId);
      const released = this.findReservationById(reservationId);
      if (!released) throw new Error('reservation release failed');
      return released;
    });
  }

  expireDueReservations(now: Date | string = new Date()): InventoryReservationReadModel[] {
    const timestamp = utcTimestamp(now);
    return this.transaction(() => {
      const due = rows<{ reservation_id: string }>(this.db, `
        SELECT reservation_id
        FROM inventory_reservations
        WHERE status='ACTIVE' AND expires_at <= ?
        ORDER BY reservation_id
      `, timestamp);
      for (const reservation of due) {
        this.db.prepare(`
          UPDATE inventory_reservations
          SET status='RELEASED',released_at=?,release_reason='EXPIRED',updated_at=?
          WHERE reservation_id=? AND status='ACTIVE'
        `).run(timestamp, timestamp, reservation.reservation_id);
      }
      return due.map(({ reservation_id: reservationId }) => {
        const expired = this.findReservationById(reservationId);
        if (!expired) throw new Error('reservation expiration failed');
        return expired;
      });
    });
  }

  convertReservation(
    reservationId: string,
    now: Date | string = new Date(),
  ): InventoryReservationReadModel {
    const timestamp = utcTimestamp(now);
    return this.transaction(() => {
      const reservation = this.findReservationById(reservationId);
      if (!reservation) throw new Error('reservation missing');
      if (reservation.status !== 'ACTIVE') return reservation;
      if (reservation.expiresAt <= timestamp) {
        this.db.prepare(`
          UPDATE inventory_reservations
          SET status='RELEASED',released_at=?,release_reason='EXPIRED',updated_at=?
          WHERE reservation_id=? AND status='ACTIVE'
        `).run(timestamp, timestamp, reservationId);
        const expired = this.findReservationById(reservationId);
        if (!expired) throw new Error('reservation expiration failed');
        return expired;
      }
      if (reservation.items.length === 0) throw new Error('reservation items missing');

      const correlationId = randomUUID();
      for (const item of reservation.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error('reservation item invariant violated');
        }
        const current = row<{ quantity_on_hand: number }>(
          this.db,
          'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku=?',
          item.productSku,
        )?.quantity_on_hand;
        if (current === undefined || !Number.isSafeInteger(current)) {
          throw new Error(`inventory balance missing: ${item.productSku}`);
        }
        const activeReserved = this.activeReservedQuantity(item.productSku, timestamp);
        const next = current - item.quantity;
        const remainingReserved = activeReserved - item.quantity;
        if (remainingReserved < 0 || next < remainingReserved || next < 0) {
          throw new Error('reservation conversion would violate inventory availability');
        }
        this.db.prepare(`
          UPDATE inventory_balances
          SET quantity_on_hand=?,updated_at=?
          WHERE product_sku=?
        `).run(next, timestamp, item.productSku);
        this.db.prepare(`
          INSERT INTO inventory_movements (
            movement_id,product_sku,delta_quantity,quantity_after,reason,
            correlation_id,created_at,reservation_id
          ) VALUES (?,?,?,?,?,?,?,?)
        `).run(
          randomUUID(),
          item.productSku,
          -item.quantity,
          next,
          'RESERVATION_CONVERTED',
          correlationId,
          timestamp,
          reservationId,
        );
      }
      this.db.prepare(`
        UPDATE inventory_reservations
        SET status='CONVERTED',converted_at=?,updated_at=?
        WHERE reservation_id=? AND status='ACTIVE'
      `).run(timestamp, timestamp, reservationId);
      const converted = this.findReservationById(reservationId);
      if (!converted) throw new Error('reservation conversion failed');
      return converted;
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

export {
  MvpCatalogReadAdapter,
  MvpOperationalSettingsReadAdapter,
} from './public-api-read-adapter';

export { SqliteOrderFoundationRepository } from './order-foundation';
