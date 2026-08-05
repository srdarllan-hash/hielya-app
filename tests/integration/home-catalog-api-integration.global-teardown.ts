import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';

const databasePath = resolve('.tmp/home-catalog-api-integration/catalog.sqlite');
const evidencePath = resolve(
  'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1/canonical-database-audit.json',
);

export default function globalTeardown() {
  const persistence = new MvpPersistenceDatabase(databasePath, undefined, { readOnly: true });
  const audit = {
    commerciallyActive: (persistence.db
      .prepare('SELECT SUM(commercially_active) AS total FROM products')
      .get() as { total: number }).total,
    publiclyVisible: (persistence.db
      .prepare('SELECT SUM(public_visible) AS total FROM product_commercial_data')
      .get() as { total: number }).total,
    inventoryMovements: (persistence.db
      .prepare('SELECT COUNT(*) AS total FROM inventory_movements')
      .get() as { total: number }).total,
    inventoryReservations: (persistence.db
      .prepare('SELECT COUNT(*) AS total FROM inventory_reservations')
      .get() as { total: number }).total,
  };
  persistence.close();

  if (Object.values(audit).some((value) => value !== 0)) {
    throw new Error(`The Home integration mutated canonical state: ${JSON.stringify(audit)}`);
  }

  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify({
    ...audit,
    canonicalPublicCatalogEmpty: true,
    persistenceMutations: 0,
  }, null, 2)}\n`);
  rmSync(dirname(databasePath), { recursive: true, force: true });
}
