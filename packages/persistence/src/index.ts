import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Statement = { run: (...args: unknown[]) => unknown; get: <T>(...args: unknown[]) => T | undefined; all: <T>(...args: unknown[]) => T[] };
type SqliteDatabase = { exec: (sql: string) => void; prepare: (sql: string) => Statement; close: () => void };
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (filename: string) => SqliteDatabase };

export type CommercialAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE';
export interface OperationalSettings { minimumProductSubtotalCents: number; deliveryBaseFeeCents: number; deliveryFeePerKmCents: number; maximumRoadDistanceKm: number; maximumPinAttempts: number; tipsEnabled: boolean }
export interface PublicCatalogProductDto { sku: string; availability: CommercialAvailability }
export interface InternalInventoryDto { sku: string; quantityOnHand: number; quantityReserved: number; quantityAvailable: number }
export interface SeedProduct { sku: string; category: string; status: 'PAUSED' | 'DEFERRED_AFTER_MVP'; kind?: 'UNIT' | 'COMPOSITE' }
export const SELECTED_EXISTING_SKUS = ['HYA-CER-001','HYA-CER-003','HYA-CER-006','HYA-CER-009','HYA-REF-016','HYA-REF-017','HYA-REF-018','HYA-REF-019','HYA-REF-020','HYA-REF-023','HYA-ENE-026','HYA-ENE-027','HYA-ENE-029','HYA-AGU-032','HYA-AGU-034','HYA-DES-036','HYA-DES-040','HYA-DES-044','HYA-VIN-046','HYA-VIN-047','HYA-VIN-049','HYA-GEL-051','HYA-GEL-052','HYA-SNA-053','HYA-SNA-054','HYA-SNA-055','HYA-SNA-056','HYA-CON-058','HYA-CON-059','HYA-CON-060'] as const;
export const BUNDLE_COMPONENTS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'HYA-CMB-001': { 'HYA-CER-001': 6, 'HYA-GEL-051': 1 }, 'HYA-CMB-002': { 'HYA-CER-003': 6, 'HYA-GEL-051': 1 },
  'HYA-CMB-003': { 'HYA-CER-006': 6, 'HYA-GEL-051': 1 }, 'HYA-CMB-004': { 'HYA-CER-009': 6, 'HYA-GEL-051': 1 },
  'HYA-CMB-005': { 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 },
  'HYA-CMB-006': { 'HYA-DES-040': 1, 'HYA-ENE-026': 4, 'HYA-GEL-051': 1, 'HYA-CON-059': 1 },
};
const allBaselineSkus = Array.from({ length: 60 }, (_, index) => {
  const number = index + 1;
  const prefix = number <= 15 ? 'CER' : number <= 25 ? 'REF' : number <= 31 ? 'ENE' : number <= 35 ? 'AGU' : number <= 45 ? 'DES' : number <= 50 ? 'VIN' : number <= 52 ? 'GEL' : number <= 57 ? 'SNA' : 'CON';
  return `HYA-${prefix}-${String(number).padStart(3, '0')}`;
});
const categoryNames: Record<string, string> = { CER: 'Cervejas', REF: 'Refrigerantes', ENE: 'Energéticos', AGU: 'Águas', DES: 'Destilados', VIN: 'Vinhos e Espumantes', GEL: 'Gelo', SNA: 'Snacks', CON: 'Conveniência' };
const categoryFor = (sku: string) => categoryNames[sku.split('-')[1]];
export const INITIAL_SEED: readonly SeedProduct[] = [
  ...allBaselineSkus.map((sku) => ({ sku, category: categoryFor(sku), status: (SELECTED_EXISTING_SKUS as readonly string[]).includes(sku) ? 'PAUSED' as const : 'DEFERRED_AFTER_MVP' as const })),
  ...Object.keys(BUNDLE_COMPONENTS).map((sku) => ({ sku, category: sku === 'HYA-CMB-005' || sku === 'HYA-CMB-006' ? 'Destilados' : 'Cervejas', status: 'PAUSED' as const, kind: 'COMPOSITE' as const })),
];
const migrationPath = fileURLToPath(new URL('../../../.dev-migrations/0001_mvp_local_36_persistence.sql', import.meta.url));
const migrationSql = () => readFileSync(migrationPath, 'utf8');
const row = <T>(db: SqliteDatabase, sql: string, ...args: unknown[]) => db.prepare(sql).get<T>(...args);
const rows = <T>(db: SqliteDatabase, sql: string, ...args: unknown[]) => db.prepare(sql).all<T>(...args);

export class MvpPersistenceDatabase {
  readonly db: SqliteDatabase;
  constructor(filename = ':memory:') { this.db = new DatabaseSync(filename); this.db.exec('PRAGMA foreign_keys = ON'); }
  migrate() { this.db.exec(migrationSql()); }
  close() { this.db.close(); }
  transaction<T>(action: () => T): T { this.db.exec('BEGIN IMMEDIATE'); try { const value = action(); this.db.exec('COMMIT'); return value; } catch (error) { this.db.exec('ROLLBACK'); throw error; } }
  seed(settings: OperationalSettings) {
    this.transaction(() => {
      ['Cervejas','Refrigerantes','Energéticos','Águas','Destilados','Vinhos e Espumantes','Gelo','Snacks','Conveniência'].forEach((name, index) => this.db.prepare('INSERT OR IGNORE INTO categories (slug,name_es,sort_order) VALUES (?,?,?)').run(name, name, index));
      INITIAL_SEED.forEach((product) => this.db.prepare('INSERT OR IGNORE INTO products (sku,category_slug,kind,mvp_status) VALUES (?,?,?,?)').run(product.sku, product.category, product.kind ?? 'UNIT', product.status));
      Object.entries(BUNDLE_COMPONENTS).forEach(([bundleSku, components]) => { this.db.prepare('INSERT OR IGNORE INTO product_bundles (product_sku) VALUES (?)').run(bundleSku); Object.entries(components).forEach(([sku, quantity]) => this.db.prepare('INSERT OR IGNORE INTO product_bundle_components (bundle_sku,component_sku,quantity) VALUES (?,?,?)').run(bundleSku, sku, quantity)); });
      this.db.prepare('INSERT OR REPLACE INTO operational_settings (id,minimum_product_subtotal_cents,delivery_base_fee_cents,delivery_fee_per_km_cents,maximum_road_distance_km,maximum_pin_attempts,tips_enabled) VALUES (1,?,?,?,?,?,?)').run(settings.minimumProductSubtotalCents, settings.deliveryBaseFeeCents, settings.deliveryFeePerKmCents, settings.maximumRoadDistanceKm, settings.maximumPinAttempts, settings.tipsEnabled ? 1 : 0);
    });
  }
  settings(): OperationalSettings { const value = row<{ minimum_product_subtotal_cents:number; delivery_base_fee_cents:number; delivery_fee_per_km_cents:number; maximum_road_distance_km:number; maximum_pin_attempts:number; tips_enabled:number }>(this.db, 'SELECT * FROM operational_settings WHERE id = 1'); if (!value) throw new Error('operational settings missing'); return { minimumProductSubtotalCents:value.minimum_product_subtotal_cents, deliveryBaseFeeCents:value.delivery_base_fee_cents, deliveryFeePerKmCents:value.delivery_fee_per_km_cents, maximumRoadDistanceKm:value.maximum_road_distance_km, maximumPinAttempts:value.maximum_pin_attempts, tipsEnabled:value.tips_enabled === 1 }; }
  updateSettings(settings: OperationalSettings) { this.seed(settings); }
  adjustInventory(sku: string, delta: number, reason = 'ADJUSTMENT') { this.transaction(() => { const current = row<{ quantity_on_hand:number }>(this.db, 'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku = ?', sku)?.quantity_on_hand ?? 0; const next = current + delta; if (next < 0) throw new Error('negative inventory is prohibited'); this.db.prepare('INSERT INTO inventory_balances (product_sku,quantity_on_hand) VALUES (?,?) ON CONFLICT(product_sku) DO UPDATE SET quantity_on_hand=excluded.quantity_on_hand,updated_at=CURRENT_TIMESTAMP').run(sku,next); this.db.prepare('INSERT INTO inventory_movements (movement_id,product_sku,delta_quantity,quantity_after,reason,correlation_id) VALUES (?,?,?,?,?,?)').run(randomUUID(),sku,delta,next,reason,randomUUID()); }); }
  internalInventory(sku: string): InternalInventoryDto { const onHand = row<{ quantity_on_hand:number }>(this.db, 'SELECT quantity_on_hand FROM inventory_balances WHERE product_sku = ?', sku)?.quantity_on_hand ?? 0; const reserved = row<{ total:number }>(this.db, "SELECT COALESCE(SUM(i.quantity),0) AS total FROM inventory_reservation_items i JOIN inventory_reservations r ON r.reservation_id=i.reservation_id WHERE r.status='ACTIVE' AND i.product_sku=?", sku)?.total ?? 0; return { sku, quantityOnHand:onHand, quantityReserved:reserved, quantityAvailable:onHand-reserved }; }
  reserveBundle(bundleSku: string, referenceId: string) { return this.transaction(() => { const components = rows<{ component_sku:string; quantity:number }>(this.db, 'SELECT component_sku,quantity FROM product_bundle_components WHERE bundle_sku=?', bundleSku); if (!components.length) throw new Error('bundle components missing'); for (const component of components) if (this.internalInventory(component.component_sku).quantityAvailable < component.quantity) throw new Error(`component unavailable: ${component.component_sku}`); const reservationId = randomUUID(); this.db.prepare("INSERT INTO inventory_reservations (reservation_id,reference_id,status) VALUES (?,?,'ACTIVE')").run(reservationId,referenceId); components.forEach((component) => this.db.prepare('INSERT INTO inventory_reservation_items (reservation_id,product_sku,quantity) VALUES (?,?,?)').run(reservationId,component.component_sku,component.quantity)); return reservationId; }); }
  publicCatalogDto(sku: string): PublicCatalogProductDto { const product = row<{ kind:string }>(this.db, 'SELECT kind FROM products WHERE sku=?', sku); if (!product) throw new Error('product missing'); if (product.kind === 'COMPOSITE') { const components = rows<{ component_sku:string; quantity:number }>(this.db, 'SELECT component_sku,quantity FROM product_bundle_components WHERE bundle_sku=?', sku); return { sku, availability:components.every((component) => this.internalInventory(component.component_sku).quantityAvailable >= component.quantity) ? 'AVAILABLE' : 'UNAVAILABLE' }; } return { sku, availability:this.internalInventory(sku).quantityAvailable > 0 ? 'AVAILABLE' : 'UNAVAILABLE' }; }
  createDeliveryPin(orderReference: string, pin: string) { if (!/^\d{4}$/.test(pin)) throw new Error('PIN must contain four digits'); this.db.prepare('INSERT OR REPLACE INTO delivery_pins (order_reference,pin_hash,attempts_used) VALUES (?,?,0)').run(orderReference,createHash('sha256').update(pin).digest('hex')); }
  verifyDeliveryPin(orderReference: string, pin: string): boolean { return this.transaction(() => { const record = row<{ pin_hash:string; attempts_used:number }>(this.db, 'SELECT pin_hash,attempts_used FROM delivery_pins WHERE order_reference=?',orderReference); if (!record) return false; const limit=this.settings().maximumPinAttempts; if (record.attempts_used >= limit) return false; const matches=record.pin_hash===createHash('sha256').update(pin).digest('hex'); this.db.prepare('UPDATE delivery_pins SET attempts_used=attempts_used+1,verified_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE verified_at END WHERE order_reference=?').run(matches ? 1 : 0,orderReference); return matches; }); }
  quoteDelivery(distanceKm: number) { const settings=this.settings(); if (!Number.isFinite(distanceKm)||distanceKm<0||distanceKm>settings.maximumRoadDistanceKm) return { eligible:false,feeCents:null }; return { eligible:true,feeCents:Math.round(settings.deliveryBaseFeeCents+settings.deliveryFeePerKmCents*distanceKm) }; }
  remainingForMinimum(productSubtotalCents: number) { return Math.max(0,this.settings().minimumProductSubtotalCents-productSubtotalCents); }
}
