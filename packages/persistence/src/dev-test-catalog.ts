import { MvpCatalogReadAdapter } from './public-api-read-adapter';
import type { MvpPersistenceDatabase } from './index';

/** Read-only development projection. Never changes commercially_active or the frozen CHECK.
 * Both explicit opt-in and an allowlisted environment are required on EVERY read.
 */
export class DevTestCatalogAdapter extends MvpCatalogReadAdapter {
  constructor(private readonly persistence: MvpPersistenceDatabase) { super(persistence); this.guard(); }
  private guard() {
    if (!['development', 'test'].includes(process.env.NODE_ENV ?? '') || process.env.HIELYA_DEV_TEST_CATALOG !== '1') {
      throw new Error('DEV_TEST_CATALOG_PROHIBITED');
    }
  }
  override listPublicCategories() { this.guard(); return this.persistence.listCategoriesInDisplayOrder().filter(c => c.isActive).map(({ id, slug, name, sortOrder }) => ({ id, slug, name, sortOrder })); }
  override listPublicProducts() {
    this.guard();
    const categories = new Set(this.listPublicCategories().map(c => c.id));
    return this.persistence.listMvpCatalogRecords()
      .filter(p => p.mvpStatus === 'PAUSED' && categories.has(p.categoryId))
      .map(p => ({ id: p.id, sku: p.sku, name: p.name, categoryId: p.categoryId, salePriceCents: p.salePriceCents,
        currency: p.currency, availability: this.persistence.getCommercialAvailability(p.sku), isPack: p.isPack,
        iceIncluded: p.iceIncluded, maxPerOrder: p.maxPerOrder, containsAlcohol: p.containsAlcohol,
        minimumAge: p.minimumAge, bundleComponents: p.isPack ? this.persistence.resolveBundleComponents(p.sku) : [] }));
  }
}
export function runtimeCatalogAdapter(db: MvpPersistenceDatabase): MvpCatalogReadAdapter {
  return process.env.HIELYA_DEV_TEST_CATALOG === '1' ? new DevTestCatalogAdapter(db) : new MvpCatalogReadAdapter(db);
}
