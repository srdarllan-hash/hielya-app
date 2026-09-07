import { operationalAvailability, type Availability } from './index';
import type { CatalogQueryPort } from '../index';

export interface OperationalStatePort {
  read(): Promise<Pick<Availability, 'storeStatus' | 'demand'>>;
}
export class UnconfiguredOperationalStatePort implements OperationalStatePort {
  read(): ReturnType<OperationalStatePort['read']> { return Promise.reject(new Error('OPERATIONAL_STATE_NOT_CONFIGURED')); }
}
/** Global indication only. Destination-specific order submission remains authoritative. */
export class StoreAvailability {
  constructor(private readonly source: OperationalStatePort, private readonly now: () => string, private readonly id: () => string) {}
  async read(): Promise<{ availability: Availability; refreshAfterMs: number }> {
    const input = await this.source.read();
    if (!['OPEN','PAUSED','CLOSED'].includes(input.storeStatus) || !['NORMAL','HIGH','UNKNOWN'].includes(input.demand?.level)) throw new Error('INVALID_OPERATIONAL_STATE');
    const now = this.now();
    const availability = operationalAvailability({ ...input, now, decisionId: this.id() });
    const snapshot = availability.alcohol.snapshot;
    const boundaries = [Date.parse(now) + 15_000];
    if (snapshot) boundaries.push(Date.parse(snapshot.estimate.validUntil));
    if (availability.alcohol.status === 'AVAILABLE' && snapshot) boundaries.push(Date.parse(snapshot.alcoholOrderCutoffAt));
    return { availability, refreshAfterMs: Math.max(0, Math.min(...boundaries) - Date.parse(now)) };
  }
  /** Internal purchase-intent guard. Never trust client containsAlcohol flags. No cart is created here. */
  async assertProducts(ids: readonly string[], catalog: CatalogQueryPort): Promise<Availability> {
    if (!ids.length) throw new Error('EMPTY_PURCHASE_INTENT');
    const products = await Promise.all(ids.map(id => catalog.findPublicProductById(id)));
    if (products.some(p => !p || p.availability !== 'AVAILABLE')) throw new Error('PRODUCT_UNAVAILABLE');
    const { availability } = await this.read();
    if (availability.storeStatus !== 'OPEN') throw new Error('STORE_NOT_OPEN');
    if (products.some(p => p!.containsAlcohol) && availability.alcohol.status !== 'AVAILABLE') throw new Error(availability.alcohol.reason);
    return availability;
  }
}
