import { CartError, type CartService, type CartValidation } from '../../../../../packages/application/src/cart';
export interface CartHttpDependencies { service: CartService; customer(token: string): string | null }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createCartHttpHandler(dependencies: () => CartHttpDependencies) {
  return async (request: Request): Promise<Response> => {
    const headers = { 'cache-control': 'no-store' };
    try {
      const { service, customer: resolve } = dependencies();
      const auth = request.headers.get('authorization');
      const customer = auth?.startsWith('Bearer ') ? resolve(auth.slice(7)) : null;
      if (auth && !customer) throw new CartError('UNAUTHORIZED');
      const requireCustomer = () => { if (!customer) throw new CartError('UNAUTHORIZED'); return customer; };
      const path = new URL(request.url).pathname.replace('/api/v1/', '').split('/');
      const key = request.headers.get('idempotency-key') ?? '';
      const body = request.method === 'GET' ? {} : await request.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CartError('INVALID_INPUT');
      const fields = (...allowed: string[]) => { if (Object.keys(body).some(k => !allowed.includes(k))) throw new CartError('INVALID_INPUT'); };
      const id = path[1]; if (path[0] === 'carts' && id && !uuid.test(id)) throw new CartError('INVALID_INPUT');
      let value: unknown; let status = 200;
      if (path.join('/') === 'carts' && request.method === 'POST') { fields(); value = service.create(key, customer); status = 201; }
      else if (path[0] === 'carts' && path.length === 2 && request.method === 'GET') value = service.read(id, customer);
      else if (path[0] === 'carts' && path[2] === 'claim' && path.length === 3 && request.method === 'POST') { fields(); value = service.claim(id, requireCustomer()); }
      else if (path[0] === 'carts' && path[2] === 'items' && path.length === 3 && request.method === 'POST') { fields('productId','quantity','revision'); value = service.mutate(id, customer, key, { productId: body.productId, quantity: body.quantity, revision: body.revision }); }
      else if (path[0] === 'carts' && path[2] === 'items' && path.length === 4 && ['PATCH','DELETE'].includes(request.method)) { fields('quantity','revision'); value = service.mutate(id, customer, key, { itemId: path[3], quantity: request.method === 'DELETE' ? 0 : body.quantity, revision: body.revision }); }
      else if (path.join('/') === 'addresses' && request.method === 'POST') { fields('formatted','latitude','longitude','kind'); value = service.saveAddress(requireCustomer(), key, { formatted: body.formatted, latitude: body.latitude, longitude: body.longitude, kind: body.kind }); status = 201; }
      else if (path[0] === 'carts' && path[2] === 'validate' && path.length === 3 && request.method === 'POST') { fields('addressId'); if (!uuid.test(body.addressId)) throw new CartError('INVALID_INPUT'); value = await service.validate(id, requireCustomer(), body.addressId, undefined, undefined, () => Boolean(auth && resolve(auth.slice(7)) === customer)); }
      else if (path.join('/') === 'checkout/reservations' && request.method === 'POST') { fields('cartId','addressId','revision'); if (!uuid.test(body.cartId) || !uuid.test(body.addressId)) throw new CartError('INVALID_INPUT'); value = await service.validate(body.cartId, requireCustomer(), body.addressId, key, body.revision, () => Boolean(auth && resolve(auth.slice(7)) === customer)); status = (value as CartValidation).valid ? 201 : 409; }
      else return Response.json({ code: 'NOT_FOUND' }, { status: 404, headers });
      return Response.json(value, { status, headers });
    } catch (error) {
      const code = error instanceof CartError ? error.code : error instanceof SyntaxError ? 'INVALID_INPUT' : 'SERVICE_UNAVAILABLE';
      const status = code === 'UNAUTHORIZED' ? 401 : code === 'NOT_FOUND' ? 404 : code === 'INVALID_INPUT' ? 400 : code === 'SERVICE_UNAVAILABLE' ? 503 : 409;
      return Response.json({ code }, { status, headers });
    }
  };
}
