import type {
  CatalogQueryPort,
  OperationalSettingsReadPort,
} from '@hielya/application';

import type { MvpPersistenceDatabase } from './index';

type CertifiedCatalogReadSource = Pick<
  MvpPersistenceDatabase,
  'listCategoriesInDisplayOrder' | 'listPubliclyEligibleProducts'
>;

type CertifiedSettingsReadSource = Pick<MvpPersistenceDatabase, 'getOperationalSettings'>;

/**
 * Read-only boundary between the certified SQLite read model and application services.
 *
 * The deliberately narrow source type excludes the public `db` handle and every mutation
 * method exposed by MvpPersistenceDatabase. Visibility is decided by the certified read
 * repositories before the adapter maps an object to the public application contract.
 */
export class MvpCatalogReadAdapter implements CatalogQueryPort {
  constructor(private readonly source: CertifiedCatalogReadSource) {}

  listPublicCategories() {
    return this.source
      .listCategoriesInDisplayOrder()
      .filter(({ isActive, publicVisible }) => isActive && publicVisible)
      .map(({ id, slug, name, sortOrder }) => ({ id, slug, name, sortOrder }));
  }

  listPublicProducts() {
    return this.source.listPubliclyEligibleProducts().map((product) => ({
      ...product,
      bundleComponents: product.bundleComponents.map((component) => ({ ...component })),
    }));
  }

  findPublicProductById(productId: string) {
    return this.listPublicProducts().find(({ id }) => id === productId);
  }
}

/** Read-only operational settings adapter used by the simulated delivery quote service. */
export class MvpOperationalSettingsReadAdapter implements OperationalSettingsReadPort {
  constructor(private readonly source: CertifiedSettingsReadSource) {}

  getDeliverySettings() {
    const {
      deliveryBaseFeeCents,
      deliveryFeePerKmCents,
      maximumRoadDistanceKm,
    } = this.source.getOperationalSettings();
    return {
      deliveryBaseFeeCents,
      deliveryFeePerKmCents,
      maximumRoadDistanceKm,
    };
  }
}
