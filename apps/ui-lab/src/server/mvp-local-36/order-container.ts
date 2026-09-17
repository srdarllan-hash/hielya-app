import type { RoutingDistancePort } from '@hielya/application';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { CartService } from '../../../../../packages/application/src/cart';
import { OrderFoundation } from '../../../../../packages/application/src/orders';
import { ValidateCustomerSession } from '../../../../../packages/application/src/auth';
import { MvpPersistenceDatabase, SqliteCustomerAuthenticationRepository } from '@hielya/persistence';
import { SqliteCartRepository } from '../../../../../packages/persistence/src/cart';
import { SqliteOrderFoundationRepository } from '../../../../../packages/persistence/src/order-foundation';
import { SimulatedRoutingDistanceAdapter, UnconfiguredRoutingDistancePort } from './container';
import { createOrderHttpHandler, type OrderHttpDependencies } from './order-http';

let composition: OrderHttpDependencies | undefined;
const unavailable = (): never => { throw new Error('ORDER_OPERATION_UNAVAILABLE'); };
export const runtimeOrderHandler = createOrderHttpHandler(() => {
  if (process.env.NODE_ENV === 'production') throw new Error('PRODUCTION_BLOCKED');
  if (composition) return composition;
  const path = process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH?.trim();
  if (!path || !existsSync(path)) throw new Error('DATABASE_UNAVAILABLE');
  const db = new MvpPersistenceDatabase(path);
  const repo = new SqliteCartRepository(db);
  const auth = new ValidateCustomerSession(new SqliteCustomerAuthenticationRepository(db));
  const simulatedDistance = process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM;
  const routing: RoutingDistancePort = simulatedDistance ? new SimulatedRoutingDistanceAdapter(Number(simulatedDistance)) : new UnconfiguredRoutingDistancePort();
  const operational = () => {
    const source = process.env.HIELYA_OPERATIONAL_STATE_PATH;
    if (!source) throw new Error('OPERATIONAL_STATE_UNAVAILABLE');
    const value = JSON.parse(readFileSync(source, 'utf8'));
    if (!['OPEN','PAUSED','CLOSED'].includes(value.storeStatus) || !['NORMAL','HIGH','UNKNOWN'].includes(value.demand?.level)) throw new Error('OPERATIONAL_STATE_INVALID');
    return value;
  };
  const now = () => new Date().toISOString();
  composition = { customer: token => auth.execute(token)?.customer.customerId ?? null,
    cart: new CartService({ transaction: operation => repo.transaction(operation), id: randomUUID, now, operational,
      roadDistance: async address => routing.getRoadDistanceKm({ latitude: address.latitude, longitude: address.longitude }) }),
    orders: source => {
      const foundation = new OrderFoundation({ repository: new SqliteOrderFoundationRepository(db, source ?? { load: unavailable }),
        now, id: randomUUID, availability: operational,
        // Customer transport exposes only create/findOwned. Workforce/payment ports have no adapter.
        authorize: unavailable, remainingEstimate: unavailable });
      return { create: foundation.create.bind(foundation), findOwned: foundation.findOwned.bind(foundation) };
    } };
  return composition;
});
