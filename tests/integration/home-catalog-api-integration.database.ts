import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';

const databasePath = resolve('.tmp/home-catalog-api-integration/catalog.sqlite');
const evidencePath = resolve(
  'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1/canonical-database-audit.json',
);

const readTotal = (persistence: MvpPersistenceDatabase, sql: string) => (
  persistence.db.prepare(sql).get() as { total: number }
).total;

const setup = () => {
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

  const commerciallyActive = readTotal(
    persistence,
    'SELECT SUM(commercially_active) AS total FROM products',
  );
  const publiclyVisible = readTotal(
    persistence,
    'SELECT SUM(public_visible) AS total FROM product_commercial_data',
  );
  persistence.close();

  if (commerciallyActive !== 0 || publiclyVisible !== 0) {
    throw new Error('The canonical integration database must remain commercially empty');
  }
};

const teardown = () => {
  const persistence = new MvpPersistenceDatabase(databasePath, undefined, { readOnly: true });
  const audit = {
    commerciallyActive: readTotal(
      persistence,
      'SELECT SUM(commercially_active) AS total FROM products',
    ),
    publiclyVisible: readTotal(
      persistence,
      'SELECT SUM(public_visible) AS total FROM product_commercial_data',
    ),
    inventoryMovements: readTotal(
      persistence,
      'SELECT COUNT(*) AS total FROM inventory_movements',
    ),
    inventoryReservations: readTotal(
      persistence,
      'SELECT COUNT(*) AS total FROM inventory_reservations',
    ),
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
};

const operation = process.argv[2];
if (operation === 'setup') setup();
else if (operation === 'teardown') teardown();
else throw new Error(`Unsupported database harness operation: ${operation ?? 'missing'}`);
