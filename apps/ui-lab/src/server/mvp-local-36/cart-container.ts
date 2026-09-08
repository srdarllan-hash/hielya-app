import type { RoutingDistancePort } from '@hielya/application';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { CartService } from '../../../../../packages/application/src/cart';
import { ValidateCustomerSession } from '../../../../../packages/application/src/auth';
import { MvpPersistenceDatabase, SqliteCustomerAuthenticationRepository } from '@hielya/persistence';
import { SqliteCartRepository } from '../../../../../packages/persistence/src/cart';
import { SimulatedRoutingDistanceAdapter, UnconfiguredRoutingDistancePort } from './container';
import { createCartHttpHandler, type CartHttpDependencies } from './cart-http';
let composition: CartHttpDependencies | undefined;
export const runtimeCartHandler = createCartHttpHandler(() => {
  if (process.env.NODE_ENV === 'production') throw new Error('PRODUCTION_BLOCKED');
  if (composition) return composition;
  const path = process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH?.trim();
  if (!path || !existsSync(path)) throw new Error('DATABASE_UNAVAILABLE');
  const db = new MvpPersistenceDatabase(path);
  const repo = new SqliteCartRepository(db);
  const auth = new ValidateCustomerSession(new SqliteCustomerAuthenticationRepository(db));
  const simulatedDistance = process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM;
  const routing: RoutingDistancePort = simulatedDistance ? new SimulatedRoutingDistanceAdapter(Number(simulatedDistance)) : new UnconfiguredRoutingDistancePort();
  composition = { customer: token => auth.execute(token)?.customer.customerId ?? null,
    service: new CartService({ transaction: operation => repo.transaction(operation), id: randomUUID, now: () => new Date().toISOString(),
      operational: () => {
        const source = process.env.HIELYA_OPERATIONAL_STATE_PATH;
        if (!source) throw new Error('OPERATIONAL_STATE_UNAVAILABLE');
        const value = JSON.parse(readFileSync(source, 'utf8'));
        if (!['OPEN','PAUSED','CLOSED'].includes(value.storeStatus) || !['NORMAL','HIGH','UNKNOWN'].includes(value.demand?.level)) throw new Error('OPERATIONAL_STATE_INVALID');
        return value;
      },
      roadDistance: async address => routing.getRoadDistanceKm({ latitude: address.latitude, longitude: address.longitude }),
    }) };
  return composition;
});
