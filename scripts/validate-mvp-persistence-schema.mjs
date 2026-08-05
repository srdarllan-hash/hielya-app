import { readFileSync } from 'node:fs';

const schema = readFileSync('.dev-migrations/0001_mvp_local_36_persistence.sql', 'utf8');
const required = ['products', 'product_bundles', 'product_bundle_components', 'operational_settings', 'inventory_balances', 'inventory_reservations', 'inventory_movements', 'delivery_pins', 'order_simulation_amounts', 'inventory_rejects_composite'];
for (const value of required) if (!schema.includes(value)) throw new Error(`Missing persistence contract: ${value}`);
if (schema.includes('commercially_active INTEGER NOT NULL DEFAULT 1')) throw new Error('Commercial activation must remain blocked');
console.log('MVP_PERSISTENCE_SCHEMA_VALID=true');
