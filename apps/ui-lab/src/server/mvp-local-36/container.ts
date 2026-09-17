import { runtimeCatalogAdapter } from '../../../../../packages/persistence/src/dev-test-catalog';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import {
  GetPublicProduct,
  ListPublicCategories,
  ListPublicProducts,
  QuoteSimulatedDelivery,
  type CatalogQueryPort,
  type CorrelationIdPort,
  type OperationalSettingsReadPort,
  type RoutingDistancePort,
} from '@hielya/application';
import {
  MvpCatalogReadAdapter,
  MvpOperationalSettingsReadAdapter,
  MvpPersistenceDatabase,
} from '@hielya/persistence';

import { createPublicApiHandlers } from './http';

class RuntimeReadOnlyPersistence {
  private persistence?: MvpPersistenceDatabase;
  private catalogAdapter?: MvpCatalogReadAdapter;
  private settingsAdapter?: MvpOperationalSettingsReadAdapter;

  private database(): MvpPersistenceDatabase {
    if (process.env.NODE_ENV === 'production') throw new Error('production API runtime is blocked');
    if (this.persistence) return this.persistence;
    const filename = process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH?.trim();
    if (!filename || !existsSync(filename)) throw new Error('runtime database is not configured');
    this.persistence = new MvpPersistenceDatabase(filename, undefined, { readOnly: true });
    return this.persistence;
  }

  catalog(): MvpCatalogReadAdapter {
    this.catalogAdapter ??= runtimeCatalogAdapter(this.database());
    return this.catalogAdapter;
  }

  settings(): MvpOperationalSettingsReadAdapter {
    this.settingsAdapter ??= new MvpOperationalSettingsReadAdapter(this.database());
    return this.settingsAdapter;
  }
}

class RuntimeCatalogPort implements CatalogQueryPort {
  constructor(private readonly source: RuntimeReadOnlyPersistence) {}

  listPublicCategories() {
    return this.source.catalog().listPublicCategories();
  }

  listPublicProducts() {
    return this.source.catalog().listPublicProducts();
  }

  findPublicProductById(productId: string) {
    return this.source.catalog().findPublicProductById(productId);
  }
}

class RuntimeSettingsPort implements OperationalSettingsReadPort {
  constructor(private readonly source: RuntimeReadOnlyPersistence) {}

  getDeliverySettings() {
    return this.source.settings().getDeliverySettings();
  }
}

export class UnconfiguredRoutingDistancePort implements RoutingDistancePort {
  getRoadDistanceKm(): Promise<number> {
    return Promise.reject(new Error('routing distance adapter is not configured'));
  }
}

/** Deterministic simulation adapter. It is intentionally unavailable in production. */
export class SimulatedRoutingDistanceAdapter implements RoutingDistancePort {
  constructor(private readonly distanceKm: number) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('simulated routing is prohibited in production');
    }
    if (!Number.isFinite(distanceKm) || distanceKm < 0) {
      throw new Error('simulated routing distance is invalid');
    }
  }

  getRoadDistanceKm(): number {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('simulated routing is prohibited in production');
    }
    return this.distanceKm;
  }
}

class CryptoCorrelationIdPort implements CorrelationIdPort {
  generate(): string {
    return randomUUID();
  }
}

export const createRuntimePublicApiHandlers = () => {
  const persistence = new RuntimeReadOnlyPersistence();
  const catalog = new RuntimeCatalogPort(persistence);
  const settings = new RuntimeSettingsPort(persistence);
  const simulatedDistance = process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM?.trim();
  let routing: RoutingDistancePort = new UnconfiguredRoutingDistancePort();
  if (simulatedDistance && process.env.NODE_ENV !== 'production') {
    const distanceKm = Number(simulatedDistance);
    if (Number.isFinite(distanceKm) && distanceKm >= 0) {
      routing = new SimulatedRoutingDistanceAdapter(distanceKm);
    }
  }
  return createPublicApiHandlers({
    listCategories: new ListPublicCategories(catalog),
    listProducts: new ListPublicProducts(catalog),
    getProduct: new GetPublicProduct(catalog),
    quoteDelivery: new QuoteSimulatedDelivery(settings, routing),
    correlationIds: new CryptoCorrelationIdPort(),
  });
};

export const runtimePublicApiHandlers = createRuntimePublicApiHandlers();
