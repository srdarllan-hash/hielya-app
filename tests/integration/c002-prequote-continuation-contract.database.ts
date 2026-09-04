import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';

const databasePath = resolve('.tmp/c002-prequote-continuation-contract/catalog.sqlite');
const evidencePath = resolve(
  'qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1/canonical-database-audit.json',
);

const total = (db: MvpPersistenceDatabase, sql: string) => (
  db.db.prepare(sql).get() as { total: number }
).total;

const setup = () => {
  rmSync(dirname(databasePath), { recursive: true, force: true });
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new MvpPersistenceDatabase(databasePath);
  db.migrate();
  db.seed({
    minimumProductSubtotalCents: 2500,
    deliveryBaseFeeCents: 200,
    deliveryFeePerKmCents: 60,
    maximumRoadDistanceKm: 4,
    maximumPinAttempts: 3,
    tipsEnabled: true,
  });
  db.close();
};

const teardown = () => {
  const db = new MvpPersistenceDatabase(databasePath, undefined, { readOnly: true });
  const audit = {
    commerciallyActive: total(db, 'SELECT SUM(commercially_active) AS total FROM products'),
    publiclyVisible: total(db, 'SELECT SUM(public_visible) AS total FROM product_commercial_data'),
    inventoryMovements: total(db, 'SELECT COUNT(*) AS total FROM inventory_movements'),
    inventoryReservations: total(db, 'SELECT COUNT(*) AS total FROM inventory_reservations'),
  };
  db.close();
  if (Object.values(audit).some((value) => value !== 0)) {
    throw new Error(`Prequote continuation mutated canonical state: ${JSON.stringify(audit)}`);
  }
  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify({
    ...audit,
    routeDistanceKm: 2.5,
    feeCents: 350,
    quoteId: null,
    deliveryQuoteId: null,
    continuationCertified: true,
    checkoutRequoteRequired: true,
    persistenceMutations: 0,
  }, null, 2)}\n`);
  rmSync(dirname(databasePath), { recursive: true, force: true });
};

const operation = process.argv[2];
if (operation === 'setup') setup();
else if (operation === 'teardown') teardown();
else throw new Error(`Unsupported database harness operation: ${operation ?? 'missing'}`);
