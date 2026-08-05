import { mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';

const databasePath = resolve('.tmp/home-catalog-api-integration/catalog.sqlite');

export default function globalSetup() {
  rmSync(dirname(databasePath), { recursive: true, force: true });
  mkdirSync(dirname(databasePath), { recursive: true });

  const persistence = new MvpPersistenceDatabase(databasePath);
  persistence.migrate();
  persistence.seed({
    minimumProductSubtotalCents: 2500,
    deliveryBaseFeeCents: 200,
    deliveryFeePerKmCents: 60,
    maximumRoadDistanceKm: 4,
    maximumPinAttempts: 3,
    tipsEnabled: true,
  });

  const active = persistence.db
    .prepare('SELECT SUM(commercially_active) AS total FROM products')
    .get() as { total: number };
  const visible = persistence.db
    .prepare('SELECT SUM(public_visible) AS total FROM product_commercial_data')
    .get() as { total: number };
  persistence.close();

  if (active.total !== 0 || visible.total !== 0) {
    throw new Error('The canonical integration database must remain commercially empty');
  }
}
