import { CartError, type CartService } from '../../../../../packages/application/src/cart';
import { OrderFoundationError, type OrderFoundation, type OrderRecord, type CreateOrderCommand } from '../../../../../packages/application/src/orders';
import type { AuthoritativeCheckoutSource } from '../../../../../packages/persistence/src/order-foundation';
import { MaterializedCheckoutSource } from './order-checkout';
import { readSessionCookie } from './session-cookie';

export interface OrderHttpDependencies {
  cart: CartService;
  customer(token: string): string | null;
  orders(source?: AuthoritativeCheckoutSource): Pick<OrderFoundation, 'create' | 'findOwned'>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const publicOrder = ({ id, revision, status, containsAlcohol, requiresAgeVerification, alcoholSnapshot, promisedLatestHandoverAt }: OrderRecord) =>
  ({ id, revision, status, containsAlcohol, requiresAgeVerification, alcoholSnapshot, promisedLatestHandoverAt });
const conflictCodes = new Set(['STALE_REVISION', 'RESERVATION_UNAVAILABLE', 'RESERVATION_MISMATCH', 'STORE_NOT_OPEN',
  'PROMISE_RECONFIRMATION_REQUIRED', 'SLA_UNAVAILABLE', 'CUTOFF_REACHED', 'AGE_NOT_VERIFIED', 'IDEMPOTENCY_CONFLICT', 'ORDER_ALREADY_EXISTS']);

export function createOrderHttpHandler(dependencies: () => OrderHttpDependencies) {
  return async (request: Request): Promise<Response> => {
    const headers = { 'cache-control': 'no-store' };
    try {
      const token = readSessionCookie(request);
      if (!token) throw new OrderFoundationError('UNAUTHORIZED');
      const { cart, customer: resolve, orders } = dependencies();
      const customer = resolve(token);
      if (!customer) throw new OrderFoundationError('UNAUTHORIZED');
      const path = new URL(request.url).pathname.replace('/api/v1/', '').split('/');
      if (request.method === 'GET' && path[0] === 'orders' && path.length === 2) {
        const order = orders().findOwned(customer, path[1]);
        if (!order) throw new OrderFoundationError('NOT_FOUND');
        return Response.json(publicOrder(order), { status: 200, headers });
      }
      if (request.method !== 'POST' || path.join('/') !== 'orders') throw new OrderFoundationError('NOT_FOUND');
      const key = request.headers.get('idempotency-key') ?? '';
      if (!/^[\x21-\x7e]{16,128}$/.test(key)
        || request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new OrderFoundationError('INVALID_REQUEST');
      let body;
      try { body = await request.json(); } catch { throw new OrderFoundationError('INVALID_REQUEST'); }
      const fields = ['cartId', 'reservationId', 'addressId', 'expectedCartRevision', 'acceptedAlcoholDecisionId', 'ageDeclarationsAccepted'];
      if (!body || typeof body !== 'object' || Array.isArray(body)
        || Object.keys(body).some(k => !fields.includes(k)) || fields.some(k => !Object.hasOwn(body, k))
        || ['cartId', 'reservationId', 'addressId'].some(k => typeof body[k] !== 'string' || !uuid.test(body[k]))
        || !Number.isSafeInteger(body.expectedCartRevision) || body.expectedCartRevision < 1
        || (body.acceptedAlcoholDecisionId !== null && (typeof body.acceptedAlcoholDecisionId !== 'string' || !uuid.test(body.acceptedAlcoholDecisionId)))
        || typeof body.ageDeclarationsAccepted !== 'boolean') throw new OrderFoundationError('INVALID_REQUEST');
      const command: CreateOrderCommand = body;
      const validation = await cart.validate(command.cartId, customer, command.addressId);
      // Routing is asynchronous: verify the cookie again before the order transaction.
      if (resolve(token) !== customer) throw new OrderFoundationError('UNAUTHORIZED');
      if (!validation.valid) return Response.json({ code: 'CHECKOUT_INVALID', message: 'Checkout validation failed.', currentAvailability: validation.cart.availability, violations: validation.violations }, { status: 409, headers });
      const source = new MaterializedCheckoutSource(validation.cart, customer, command.addressId);
      const result = orders(source).create(customer, key, command);
      return Response.json(publicOrder(result.order), { status: 201, headers });
    } catch (error) {
      const original = error instanceof OrderFoundationError || error instanceof CartError ? error.code : 'SERVICE_UNAVAILABLE';
      const code = original === 'INVALID_INPUT' ? 'INVALID_REQUEST' : original;
      const status = code === 'UNAUTHORIZED' ? 401 : code === 'NOT_FOUND' ? 404 : code === 'FORBIDDEN' ? 403
        : code === 'INVALID_REQUEST' ? 400 : conflictCodes.has(code) ? 409 : 503;
      const safeCode = status === 503 ? 'SERVICE_UNAVAILABLE' : code;
      return Response.json({ code: safeCode, message: safeCode, currentAvailability: error instanceof OrderFoundationError ? error.currentAvailability ?? null : null }, { status, headers });
    }
  };
}
