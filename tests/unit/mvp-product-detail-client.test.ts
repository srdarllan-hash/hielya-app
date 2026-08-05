import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CatalogClientError,
  createMvpCatalogClient,
} from '../../apps/ui-lab/src/client/mvp-local-36/catalog-client';

const CORRELATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const product = {
  id: PRODUCT_ID,
  sku: 'SYN-UNIT-001',
  name: 'Producto sintético',
  categoryId: CATEGORY_ID,
  salePriceCents: 250,
  currency: 'EUR',
  availability: 'AVAILABLE',
  isPack: false,
  iceIncluded: false,
  maxPerOrder: 2,
  containsAlcohol: false,
} as const;

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response => new Response(
  JSON.stringify(body),
  {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': CORRELATION_ID,
      ...init.headers,
    },
  },
);

afterEach(() => {
  vi.useRealTimers();
});

describe('MVP Local 36 product-detail HTTP client', () => {
  it('gets one PublicProduct by UUID from the certified relative endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse(product));
    const client = createMvpCatalogClient({ fetch });

    await expect(client.getProduct(PRODUCT_ID, {
      correlationId: CORRELATION_ID,
    })).resolves.toEqual({
      data: product,
      correlationId: CORRELATION_ID,
    });
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/catalog/products/${PRODUCT_ID}`,
      {
        method: 'GET',
        headers: { 'x-correlation-id': CORRELATION_ID },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it('rejects a non-UUID before issuing an HTTP request', async () => {
    const fetch = vi.fn(async () => jsonResponse(product));
    const client = createMvpCatalogClient({ fetch });

    await expect(client.getProduct('not-a-uuid')).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      message: 'The product identifier is invalid.',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps a structured 404 and its correlation ID for the safe not-found state', async () => {
    const publicError = {
      code: 'PRODUCT_NOT_FOUND',
      message: 'Producto no encontrado.',
      correlationId: CORRELATION_ID,
    } as const;
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse(publicError, { status: 404 }),
    });

    await expect(client.getProduct(PRODUCT_ID)).rejects.toMatchObject({
      kind: 'HTTP_ERROR',
      options: {
        status: 404,
        correlationId: CORRELATION_ID,
        publicError,
      },
    });
  });

  it('preserves a safe structured 400 for an invalid productId', async () => {
    const publicError = {
      code: 'INVALID_INPUT',
      message: 'El identificador del producto no es válido.',
      correlationId: CORRELATION_ID,
      field: 'productId',
    } as const;
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse(publicError, { status: 400 }),
    });

    await expect(client.getProduct(PRODUCT_ID)).rejects.toMatchObject({
      name: 'CatalogClientError',
      kind: 'HTTP_ERROR',
      message: publicError.message,
      options: {
        status: 400,
        correlationId: CORRELATION_ID,
        publicError,
      },
    });
  });

  it('rejects any successful detail payload containing an internal field', async () => {
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse({ ...product, physicalStock: 18 }),
    });

    await expect(client.getProduct(PRODUCT_ID)).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      options: { correlationId: CORRELATION_ID },
    });
  });

  it('rejects a valid 200 payload whose resource id differs from the requested id', async () => {
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse({
        ...product,
        id: '33333333-3333-4333-8333-333333333333',
      }),
    });

    await expect(client.getProduct(PRODUCT_ID)).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      message: 'The catalog response is invalid.',
      options: { correlationId: CORRELATION_ID },
    });
  });

  it('supports caller cancellation for a detail request', async () => {
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const controller = new AbortController();
    const client = createMvpCatalogClient({ fetch });
    const request = client.getProduct(PRODUCT_ID, { signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toMatchObject({ kind: 'ABORTED' });
  });

  it('aborts and reports a deterministic detail timeout', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const client = createMvpCatalogClient({ fetch, defaultTimeoutMs: 50 });
    const request = client.getProduct(PRODUCT_ID);
    const assertion = expect(request).rejects.toMatchObject({ kind: 'TIMEOUT' });

    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('uses CatalogClientError without leaking malformed response content', async () => {
    const client = createMvpCatalogClient({
      fetch: async () => new Response('SQL /private/inventory', { status: 200 }),
    });

    const request = client.getProduct(PRODUCT_ID);
    await expect(request).rejects.toBeInstanceOf(CatalogClientError);
    await expect(request).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      message: 'The catalog response is invalid.',
    });
  });
});
