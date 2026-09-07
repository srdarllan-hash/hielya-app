import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { StoreAvailability, type OperationalStatePort } from '../../../../../packages/application/src/orders/store-availability';

/** Development-only authoritative input file. Never renew stale estimates automatically. */
class RuntimeOperationalState implements OperationalStatePort {
  async read(): ReturnType<OperationalStatePort['read']> {
    if (process.env.NODE_ENV === 'production') throw new Error('PRODUCTION_BLOCKED');
    const path = process.env.HIELYA_OPERATIONAL_STATE_PATH?.trim();
    if (!path) throw new Error('OPERATIONAL_STATE_NOT_CONFIGURED');
    return JSON.parse(await readFile(path, 'utf8'));
  }
}
export const createStoreStateHandler = (service: StoreAvailability) => async (): Promise<Response> => {
  try {
    const result = await service.read();
    return Response.json(result.availability, { headers: { 'cache-control': 'no-store', 'x-hielya-refresh-after-ms': String(result.refreshAfterMs) } });
  } catch {
    return Response.json({ code: 'SERVICE_UNAVAILABLE', message: 'Operational state unavailable.', currentAvailability: null }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
};
export const runtimeStoreStateHandler = createStoreStateHandler(new StoreAvailability(new RuntimeOperationalState(), () => new Date().toISOString(), randomUUID));
