import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CatalogClientError,
  createMvpCatalogClient,
} from '../../apps/ui-lab/src/client/mvp-local-36/catalog-client';

const CORRELATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';

const category = {
  id: CATEGORY_ID,
  slug: 'synthetic-drinks',
  name: 'Bebidas de prueba',
  sortOrder: 1,
};

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

describe('MVP Local 36 catalog HTTP client', () => {
  it('uses the relative categories endpoint and returns the response correlation ID', async () => {
    const fetch = vi.fn(async () => jsonResponse([category]));
    const client = createMvpCatalogClient({ fetch });

    await expect(client.listCategories({ correlationId: CORRELATION_ID })).resolves.toEqual({
      data: [category],
      correlationId: CORRELATION_ID,
    });
    expect(fetch).toHaveBeenCalledWith('/api/v1/catalog/categories', {
      method: 'GET',
      headers: { 'x-correlation-id': CORRELATION_ID },
      signal: expect.any(AbortSignal),
    });
  });

  it('serializes only the five certified product query parameters', async () => {
    const fetch = vi.fn(async () => jsonResponse({
      items: [product],
      page: 1,
      pageSize: 20,
      total: 1,
    }));
    const client = createMvpCatalogClient({ fetch });

    const response = await client.listProducts({
      q: 'agua fría',
      category: CATEGORY_ID,
      availableOnly: true,
      page: 1,
      pageSize: 20,
    });

    expect(response.data.items).toEqual([product]);
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/catalog/products?q=agua+fr%C3%ADa&category=${CATEGORY_ID}&availableOnly=true&page=1&pageSize=20`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('accepts every optional public product field allowed by the OpenAPI contract', async () => {
    const completeProduct = {
      ...product,
      ean: null,
      description: 'Descripción pública',
      brand: 'Marca sintética',
      subcategory: null,
      volumeLabel: '500 ml',
      grossWeightKg: 0.55,
      estimatedVolumeLiters: 0.5,
      unitPriceLabel: '5,00 €/l',
      temperatureProfile: 'CHILLED',
      readyToConsume: true,
      minimumAge: null,
      alcoholPercentage: null,
      imageUrl: 'https://example.invalid/product.svg',
      keywords: ['sintético'],
      bundleComponents: [],
    } as const;
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse({
        items: [completeProduct],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    });

    await expect(client.listProducts()).resolves.toMatchObject({
      data: { items: [completeProduct] },
    });
  });

  it('returns a structured public error for non-2xx responses', async () => {
    const publicError = {
      code: 'INVALID_INPUT',
      message: 'La búsqueda no es válida.',
      correlationId: CORRELATION_ID,
      field: 'q',
    } as const;
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse(publicError, { status: 400 }),
    });

    await expect(client.listProducts({ q: 'x' })).rejects.toMatchObject({
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

  it('rejects successful payloads that do not conform to the public contract', async () => {
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse({
        items: [{ ...product, physicalStock: 99 }],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    });

    await expect(client.listProducts()).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      options: { correlationId: CORRELATION_ID },
    });
  });

  it('rejects a product pageSize above the OpenAPI maximum of 100', async () => {
    const client = createMvpCatalogClient({
      fetch: async () => jsonResponse({
        items: [],
        page: 1,
        pageSize: 101,
        total: 0,
      }),
    });

    await expect(client.listProducts()).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      message: 'The catalog response is invalid.',
    });
  });

  it('reports invalid JSON as an invalid public payload without leaking the body', async () => {
    const client = createMvpCatalogClient({
      fetch: async () => new Response('not-json', {
        status: 200,
        headers: { 'x-correlation-id': CORRELATION_ID },
      }),
    });

    const rejection = client.listCategories();
    await expect(rejection).rejects.toBeInstanceOf(CatalogClientError);
    await expect(rejection).rejects.toMatchObject({
      kind: 'INVALID_PAYLOAD',
      message: 'The catalog response is invalid.',
    });
  });

  it('cancels a request through the caller AbortSignal', async () => {
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const controller = new AbortController();
    const client = createMvpCatalogClient({ fetch });
    const request = client.listCategories({ signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toMatchObject({ kind: 'ABORTED' });
  });

  it('aborts and reports a deterministic timeout', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const client = createMvpCatalogClient({ fetch, defaultTimeoutMs: 50 });
    const request = client.listCategories();
    const assertion = expect(request).rejects.toMatchObject({ kind: 'TIMEOUT' });

    await vi.advanceTimersByTimeAsync(50);

    await assertion;
  });
});
