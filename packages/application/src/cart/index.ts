import type { PublicProduct } from '../index';
import { operationalAvailability, type Availability } from '../orders';

export class CartError extends Error { constructor(public readonly code: string) { super(code); } }
export const cartFail = (code: string): never => { throw new CartError(code); };
export interface CartAddress { id: string; customerId: string; formatted: string; latitude: number; longitude: number; kind: string }
export interface CartRecord { id: string; customerId: string | null; revision: number; addressId: string | null; items: { id: string; productId: string; quantity: number }[]; reservationId: string | null }
export interface CartReservation { id: string; status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'; expiresAt: string; items: { productSku: string; quantity: number }[] }
export interface CartSettings { minimumProductSubtotalCents: number; deliveryBaseFeeCents: number; deliveryFeePerKmCents: number; maximumRoadDistanceKm: number; inventoryReservationTtlSeconds: number }
export interface CartTransaction {
  load(id: string): CartRecord | undefined; save(cart: CartRecord): void;
  address(id: string): CartAddress | undefined; saveAddress(address: CartAddress): void;
  product(id: string): PublicProduct | undefined; available(sku: string, now: string): number;
  settings(): CartSettings; reservation(id: string, now: string): CartReservation | undefined;
  reserve(reference: string, items: { productSku: string; quantity: number }[], now: string): CartReservation;
  release(id: string, now: string): void;
  receipt(scope: string, key: string): { fingerprint: string; value: unknown } | undefined;
  remember(scope: string, key: string, fingerprint: string, value: unknown): void;
}
export interface CartPorts {
  transaction<T>(operation: (tx: CartTransaction) => T): T;
  id(): string; now(): string;
  operational(address: CartAddress | null, now: string): Pick<Availability, 'storeStatus' | 'demand'>;
  roadDistance(address: CartAddress): Promise<number>;
}
export interface CartView {
  id: string; revision: number; status: 'ACTIVE' | 'RESERVED';
  items: { id: string; product: PublicProduct; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  productSubtotalCents: number; deliveryFeeCents: number | null; totalCents: number | null;
  minimumReached: boolean; amountMissingForMinimumCents: number;
  reservation: Omit<CartReservation, 'items'> | null; availability: Availability;
  serverNow: string; refreshAfterMs: number;
}
export interface CartValidation { valid: boolean; violations: string[]; cart: CartView }
export class CartService {
  constructor(private readonly ports: CartPorts) {}
  private owned(tx: CartTransaction, id: string, customer: string | null): CartRecord {
    const cart = tx.load(id);
    if (!cart || (cart.customerId !== null && cart.customerId !== customer)) return cartFail('NOT_FOUND');
    return cart;
  }
  private once<T>(tx: CartTransaction, scope: string, key: string, payload: unknown, action: () => T): T {
    if (!/^[\x21-\x7e]{16,128}$/.test(key)) return cartFail('INVALID_INPUT');
    const fingerprint = JSON.stringify(payload); const prior = tx.receipt(scope, key);
    if (prior) { if (prior.fingerprint !== fingerprint) return cartFail('IDEMPOTENCY_CONFLICT'); return prior.value as T; }
    const value = action(); tx.remember(scope, key, fingerprint, value); return value;
  }
  private availability(address: CartAddress | null, now: string): Availability {
    return operationalAvailability({ ...this.ports.operational(address, now), now, decisionId: this.ports.id() });
  }
  private view(tx: CartTransaction, cart: CartRecord, now: string, address: CartAddress | null = null, distance?: number): CartView {
    const settings = tx.settings();
    const items = cart.items.map(item => { const product = tx.product(item.productId); if (!product) return cartFail('PRODUCT_UNAVAILABLE'); return { id: item.id, quantity: item.quantity, product, unitPriceCents: product.salePriceCents, lineTotalCents: product.salePriceCents * item.quantity }; });
    const subtotal = items.reduce((n, i) => n + i.lineTotalCents, 0);
    if (!Number.isSafeInteger(subtotal)) return cartFail('INVALID_INPUT');
    const reservation = cart.reservationId ? tx.reservation(cart.reservationId, now) ?? null : null;
    const availability = this.availability(address, now);
    const fee = distance === undefined ? null : settings.deliveryBaseFeeCents + Math.round(settings.deliveryFeePerKmCents * distance);
    const boundaries = [Date.parse(now) + 15_000];
    if (reservation?.status === 'ACTIVE') boundaries.push(Date.parse(reservation.expiresAt));
    const snapshot = availability.alcohol.snapshot;
    if (snapshot) { boundaries.push(Date.parse(snapshot.estimate.validUntil)); if (availability.alcohol.status === 'AVAILABLE') boundaries.push(Date.parse(snapshot.alcoholOrderCutoffAt)); }
    return { id: cart.id, revision: cart.revision, status: reservation?.status === 'ACTIVE' ? 'RESERVED' : 'ACTIVE', items,
      productSubtotalCents: subtotal, deliveryFeeCents: fee, totalCents: fee === null ? null : subtotal + fee,
      minimumReached: subtotal >= settings.minimumProductSubtotalCents, amountMissingForMinimumCents: Math.max(0, settings.minimumProductSubtotalCents - subtotal),
      reservation: reservation ? { id: reservation.id, status: reservation.status, expiresAt: reservation.expiresAt } : null,
      availability, serverNow: now, refreshAfterMs: Math.max(0, Math.min(...boundaries) - Date.parse(now)) };
  }
  private stock(tx: CartTransaction, view: CartView, now: string): boolean {
    const required = new Map<string, number>();
    for (const item of view.items) {
      if (item.quantity > item.product.maxPerOrder || item.product.availability === 'TEMPORARILY_UNAVAILABLE') return false;
      const components = item.product.isPack ? item.product.bundleComponents : [{ sku: item.product.sku, quantity: 1 }];
      if (!components?.length) return false;
      for (const c of components) required.set(c.sku, (required.get(c.sku) ?? 0) + c.quantity * item.quantity);
    }
    const held = view.reservation?.status === 'ACTIVE' ? tx.reservation(view.reservation.id, now)?.items ?? [] : [];
    return [...required].every(([sku, quantity]) => Number.isSafeInteger(quantity) && tx.available(sku, now) + (held.find(i => i.productSku === sku)?.quantity ?? 0) >= quantity);
  }
  create(key: string, customer: string | null): CartView {
    return this.ports.transaction(tx => { const id = this.once(tx, `create:${customer ?? 'guest'}`, key, null, () => { const cart: CartRecord = { id: this.ports.id(), customerId: customer, revision: 1, addressId: null, items: [], reservationId: null }; tx.save(cart); return cart.id; }); return this.view(tx, this.owned(tx, id, customer), this.ports.now()); });
  }
  read(id: string, customer: string | null): CartView { return this.ports.transaction(tx => this.view(tx, this.owned(tx, id, customer), this.ports.now())); }
  claim(id: string, customer: string): CartView {
    return this.ports.transaction(tx => { const cart = this.owned(tx, id, customer); if (!cart.customerId) { cart.customerId = customer; cart.revision++; tx.save(cart); } return this.view(tx, cart, this.ports.now()); });
  }
  mutate(id: string, customer: string | null, key: string, command: { revision: number; productId?: string; itemId?: string; quantity: number }): CartView {
    return this.ports.transaction(tx => {
      const cart = this.owned(tx, id, customer);
      this.once(tx, `edit:${id}`, key, command, () => {
        if (cart.revision !== command.revision) return cartFail('STALE_REVISION');
        if (!Number.isSafeInteger(command.quantity) || command.quantity < 0) return cartFail('INVALID_INPUT');
        const now = this.ports.now();
        const item = command.itemId ? cart.items.find(i => i.id === command.itemId) : cart.items.find(i => i.productId === command.productId);
        if (command.itemId && !item) return cartFail('NOT_FOUND');
        const product = tx.product(item?.productId ?? command.productId ?? '');
        if (!product || (!command.itemId && command.quantity === 0)) return cartFail('INVALID_INPUT');
        const previous = item?.quantity ?? 0;
        const quantity = command.itemId ? command.quantity : previous + command.quantity;
        if (!Number.isSafeInteger(quantity) || quantity > product.maxPerOrder) return cartFail('SKU_LIMIT_EXCEEDED');
        const increasing = quantity > previous;
        if (increasing) { const availability = this.availability(null, now); if (product.availability === 'TEMPORARILY_UNAVAILABLE') return cartFail('PRODUCT_UNAVAILABLE'); if (product.containsAlcohol && availability.alcohol.status !== 'AVAILABLE') return cartFail('ALCOHOL_CUTOFF'); }
        // Cancellation and mutation commit together; expiration wins at its exact deadline.
        if (cart.reservationId) tx.release(cart.reservationId, now);
        cart.reservationId = null;
        if (item) { item.quantity = quantity; cart.items = cart.items.filter(i => i.quantity > 0); }
        else cart.items.push({ id: this.ports.id(), productId: product.id, quantity });
        const view = this.view(tx, cart, now);
        if (increasing && !this.stock(tx, view, now)) return cartFail('OUT_OF_STOCK');
        cart.revision++; tx.save(cart); return true;
      });
      return this.view(tx, this.owned(tx, id, customer), this.ports.now());
    });
  }
  saveAddress(customer: string, key: string, input: Omit<CartAddress, 'id' | 'customerId'>): CartAddress {
    if (typeof input.formatted !== 'string' || !input.formatted.trim() || input.formatted.length > 500 || !Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180 || !['residential','hotel','condominium','business','public_space','unknown'].includes(input.kind)) return cartFail('INVALID_INPUT');
    return this.ports.transaction(tx => this.once(tx, `address:${customer}`, key, input, () => { const address = { ...input, id: this.ports.id(), customerId: customer }; tx.saveAddress(address); return address; }));
  }
  async validate(id: string, customer: string, addressId: string, reserveKey?: string, revision?: number, authorize: () => boolean = () => true): Promise<CartValidation> {
    if (reserveKey !== undefined && !/^[\x21-\x7e]{16,128}$/.test(reserveKey)) return cartFail('INVALID_INPUT');
    const address = this.ports.transaction(tx => { const cart = this.owned(tx, id, customer); const a = tx.address(addressId); if (cart.customerId !== customer || !a || a.customerId !== customer) return cartFail('NOT_FOUND'); return a; });
    const distance = await this.ports.roadDistance(address);
    if (!Number.isFinite(distance) || distance < 0) return cartFail('SERVICE_UNAVAILABLE');
    return this.ports.transaction(tx => {
      if (!authorize()) return cartFail('UNAUTHORIZED');
      const cart = this.owned(tx, id, customer); const now = this.ports.now();
      let view = this.view(tx, cart, now, address, distance);
      const violations: string[] = [];
      if (!view.items.length) violations.push('EMPTY_CART');
      if (!view.minimumReached) violations.push('MINIMUM_NOT_REACHED');
      if (distance > tx.settings().maximumRoadDistanceKm) violations.push('OUTSIDE_AREA');
      if (address.kind === 'public_space' || address.kind === 'unknown') violations.push('PUBLIC_SPACE_BLOCKED');
      if (view.availability.storeStatus !== 'OPEN') violations.push('STORE_CLOSED');
      if (view.items.some(i => i.product.containsAlcohol) && view.availability.alcohol.status !== 'AVAILABLE') violations.push('ALCOHOL_CUTOFF');
      if (!this.stock(tx, view, now)) violations.push('OUT_OF_STOCK');
      if (reserveKey) {
        if (view.reservation?.status === 'ACTIVE' && cart.addressId !== addressId) return cartFail('RESERVATION_ADDRESS_CONFLICT');
        // Replay never renews; after expiry or editing the original key stays consumed.
        const receipt = tx.receipt(`reserve:${id}`, reserveKey);
        if (receipt) { if (receipt.fingerprint !== JSON.stringify({ addressId, revision })) return cartFail('IDEMPOTENCY_CONFLICT'); return { valid: violations.length === 0, violations, cart: view }; }
        if (cart.revision !== revision) return cartFail('STALE_REVISION');
        if (!violations.length) {
          this.once(tx, `reserve:${id}`, reserveKey, { addressId, revision }, () => {
            if (view.reservation?.status === 'ACTIVE') return view.reservation.id;
            if (tx.settings().inventoryReservationTtlSeconds !== 600) return cartFail('SERVICE_UNAVAILABLE');
            const reservation = tx.reserve(this.ports.id(), view.items.map(i => ({ productSku: i.product.sku, quantity: i.quantity })), now);
            cart.reservationId = reservation.id; cart.addressId = addressId; cart.revision++; tx.save(cart); return reservation.id;
          });
          view = this.view(tx, cart, now, address, distance);
        }
      }
      return { valid: violations.length === 0, violations, cart: view };
    });
  }
}
