import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DeliveryQuoteClientError,
  createMvpDeliveryQuoteClient,
} from '../../apps/ui-lab/src/client/mvp-local-36/delivery-quote-client';
import { DeliveryQuoteServiceAreaAdapter } from '../../apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter';
import {
  LocationDomainError,
  fakeAddresses,
  type LocationResult,
} from '@hielya/location';

const CORRELATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const location: LocationResult = {
  source: 'manual',
  coordinates: fakeAddresses[0].coordinates,
  address: fakeAddresses[0],
  confidence: 'exact',
  confirmedByUser: true,
  confirmedAt: '2026-08-08T00:00:00.000Z',
  serviceArea: null,
  deliveryQuoteId: null,
};

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

const publicError = (
  code: 'INVALID_INPUT' | 'OUT_OF_AREA' | 'CONFIGURATION_UNAVAILABLE',
  field?: string,
) => ({
  code,
  message: `Safe ${code}`,
  correlationId: CORRELATION_ID,
  ...(field ? { field } : {}),
});

afterEach(() => {
  vi.useRealTimers();
});

describe('C-002 delivery-quote HTTP client', () => {
  it('posts only coordinates to the certified relative endpoint', async () => {
    const fetch = vi.fn(async (
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ) => {
      void _input;
      void _init;
      return jsonResponse({
        withinArea: true,
        routeDistanceKm: 2.5,
        feeCents: 350,
      });
    });
    const client = createMvpDeliveryQuoteClient({ fetch });

    await expect(client.quoteDelivery({
      latitude: 36.54,
      longitude: -4.62,
    })).resolves.toEqual({
      data: {
        withinArea: true,
        routeDistanceKm: 2.5,
        feeCents: 350,
      },
      correlationId: CORRELATION_ID,
    });

    expect(fetch).toHaveBeenCalledWith('/api/v1/delivery/quote', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }),
      signal: expect.any(AbortSignal),
    });
    const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
    expect(Object.keys(body).sort()).toEqual(['latitude', 'longitude']);
    expect(body).not.toHaveProperty('routeDistanceKm');
    expect(body).not.toHaveProperty('feeCents');
    expect(body).not.toHaveProperty('radiusMeters');
  });

  it('rejects coordinates outside the public contract before fetch', async () => {
    const fetch = vi.fn(async () => jsonResponse({
      withinArea: true,
      routeDistanceKm: 0,
      feeCents: 200,
    }));
    const client = createMvpDeliveryQuoteClient({ fetch });

    await expect(client.quoteDelivery({ latitude: 91, longitude: -4.62 }))
      .rejects.toMatchObject({ kind: 'INVALID_PAYLOAD' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a successful response with an undeclared internal field', async () => {
    const client = createMvpDeliveryQuoteClient({
      fetch: async () => jsonResponse({
        withinArea: true,
        routeDistanceKm: 2.5,
        feeCents: 350,
        maximumRoadDistanceKm: 4,
      }),
    });

    await expect(client.quoteDelivery({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({
        kind: 'INVALID_PAYLOAD',
        message: 'The delivery quote response is invalid.',
        options: { correlationId: CORRELATION_ID },
      });
  });

  it.each([
    ['non-JSON', new Response('not-json', { status: 200 })],
    ['JSON body with a non-JSON media type', new Response(JSON.stringify({
      withinArea: true,
      routeDistanceKm: 2.5,
      feeCents: 350,
    }), { status: 200, headers: { 'content-type': 'text/plain' } })],
    ['incomplete', jsonResponse({ withinArea: true, routeDistanceKm: 2.5 })],
    ['negative distance', jsonResponse({
      withinArea: true,
      routeDistanceKm: -1,
      feeCents: 200,
    })],
    ['negative fee', jsonResponse({
      withinArea: true,
      routeDistanceKm: 1,
      feeCents: -1,
    })],
  ])('rejects a %s successful response as invalid payload', async (_label, response) => {
    const client = createMvpDeliveryQuoteClient({ fetch: async () => response });

    await expect(client.quoteDelivery({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({ kind: 'INVALID_PAYLOAD' });
  });

  it('rejects a valid quote under an undeclared success status', async () => {
    const client = createMvpDeliveryQuoteClient({
      fetch: async () => jsonResponse({
        withinArea: true,
        routeDistanceKm: 2.5,
        feeCents: 350,
      }, { status: 201 }),
    });

    await expect(client.quoteDelivery({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({ kind: 'HTTP_ERROR', options: { status: 201 } });
  });

  it('discards an invalid response correlation ID', async () => {
    const client = createMvpDeliveryQuoteClient({
      fetch: async () => jsonResponse(
        { withinArea: true, routeDistanceKm: 2.5, feeCents: 350 },
        { headers: { 'x-correlation-id': 'not-a-uuid' } },
      ),
    });

    await expect(client.quoteDelivery({ latitude: 36.54, longitude: -4.62 }))
      .resolves.toMatchObject({ correlationId: null });
  });

  it('does not trust a PublicError with an undeclared property', async () => {
    const client = createMvpDeliveryQuoteClient({
      fetch: async () => jsonResponse({
        ...publicError('CONFIGURATION_UNAVAILABLE'),
        internalReason: 'SQL /private/inventory',
      }, { status: 400 }),
    });

    const error = await client.quoteDelivery({ latitude: 36.54, longitude: -4.62 })
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      kind: 'HTTP_ERROR',
      message: 'The delivery quote request failed.',
      options: { correlationId: CORRELATION_ID },
    });
    expect((error as DeliveryQuoteClientError).options.publicError).toBeUndefined();
  });

  it('classifies a transport rejection as NETWORK_ERROR', async () => {
    const client = createMvpDeliveryQuoteClient({
      fetch: async () => { throw new Error('socket failed'); },
    });

    await expect(client.quoteDelivery({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({
        kind: 'NETWORK_ERROR',
        message: 'The delivery quote request failed.',
      });
  });

  it('retains only a valid diagnostic correlation ID from an error response', async () => {
    const error = publicError('CONFIGURATION_UNAVAILABLE');
    const client = createMvpDeliveryQuoteClient({
      fetch: async () => jsonResponse(error, { status: 400 }),
    });

    await expect(client.quoteDelivery({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({
        kind: 'HTTP_ERROR',
        options: {
          status: 400,
          correlationId: CORRELATION_ID,
          publicError: error,
        },
      });
  });

  it('supports caller cancellation', async () => {
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const controller = new AbortController();
    const client = createMvpDeliveryQuoteClient({ fetch });
    const request = client.quoteDelivery(
      { latitude: 36.54, longitude: -4.62 },
      { signal: controller.signal },
    );

    controller.abort();

    await expect(request).rejects.toBeInstanceOf(DeliveryQuoteClientError);
    await expect(request).rejects.toMatchObject({ kind: 'ABORTED' });
  });

  it('preserves caller cancellation while reading a response body', async () => {
    let bodyStarted!: () => void;
    const bodyHasStarted = new Promise<void>((resolve) => { bodyStarted = resolve; });
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal;
      return {
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'x-correlation-id': CORRELATION_ID,
        }),
        json: () => new Promise((_resolve, reject) => {
          bodyStarted();
          signal.addEventListener('abort', () => reject(
            signal.reason ?? new DOMException('Aborted', 'AbortError'),
          ), { once: true });
        }),
      } as Response;
    });
    const controller = new AbortController();
    const client = createMvpDeliveryQuoteClient({ fetch });
    const request = client.quoteDelivery(
      { latitude: 36.54, longitude: -4.62 },
      { signal: controller.signal },
    );

    await bodyHasStarted;
    controller.abort();

    await expect(request).rejects.toMatchObject({ kind: 'ABORTED' });
  });

  it('aborts and classifies its own timeout separately from cancellation', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const client = createMvpDeliveryQuoteClient({ fetch, defaultTimeoutMs: 50 });
    const request = client.quoteDelivery({ latitude: 36.54, longitude: -4.62 });
    const assertion = expect(request).rejects.toMatchObject({ kind: 'TIMEOUT' });

    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('preserves timeout classification while reading a response body', async () => {
    vi.useFakeTimers();
    let bodyStarted!: () => void;
    const bodyHasStarted = new Promise<void>((resolve) => { bodyStarted = resolve; });
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal;
      return {
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'x-correlation-id': CORRELATION_ID,
        }),
        json: () => new Promise((_resolve, reject) => {
          bodyStarted();
          signal.addEventListener('abort', () => reject(
            signal.reason ?? new DOMException('Aborted', 'AbortError'),
          ), { once: true });
        }),
      } as Response;
    });
    const client = createMvpDeliveryQuoteClient({ fetch, defaultTimeoutMs: 50 });
    const request = client.quoteDelivery({ latitude: 36.54, longitude: -4.62 });

    await bodyHasStarted;
    const assertion = expect(request).rejects.toMatchObject({ kind: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });
});

describe('C-002 HTTP ServiceAreaService adapter', () => {
  it.each([
    [0, 200],
    [1, 260],
    [2, 320],
    [2.5, 350],
    [3, 380],
    [4, 440],
  ])('maps the server quote for %s km and %s cents without recalculation', async (
    routeDistanceKm,
    feeCents,
  ) => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => jsonResponse({ withinArea: true, routeDistanceKm, feeCents }),
    });

    await expect(service.validate(location)).resolves.toEqual({
      serviceable: true,
      reason: 'SERVICEABLE',
      distanceMeters: routeDistanceKm * 1_000,
      distanceMethod: 'route',
      radiusMeters: null,
      storeId: null,
      deliveryFeeCents: feeCents,
      estimatedMinutes: null,
      quoteId: null,
      expiresAt: null,
    });
  });

  it('maps canonical OUT_OF_AREA without inventing distance, radius or fee', async () => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => jsonResponse(publicError('OUT_OF_AREA'), { status: 400 }),
    });

    await expect(service.validate(location)).resolves.toEqual({
      serviceable: false,
      reason: 'OUTSIDE_RADIUS',
      distanceMeters: null,
      distanceMethod: 'route',
      radiusMeters: null,
      storeId: null,
      deliveryFeeCents: null,
      estimatedMinutes: null,
      quoteId: null,
      expiresAt: null,
    });
  });

  it('blocks a public-space quote while preserving the valid server quote', async () => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => jsonResponse({
        withinArea: true,
        routeDistanceKm: 1,
        feeCents: 260,
        publicSpaceBlocked: true,
      }),
    });

    await expect(service.validate(location)).resolves.toMatchObject({
      serviceable: false,
      reason: 'PUBLIC_SPACE_NOT_ALLOWED',
      distanceMeters: 1_000,
      deliveryFeeCents: 260,
    });
  });

  it('maps an explicit 200 withinArea=false without inventing missing fields', async () => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => jsonResponse({
        withinArea: false,
        routeDistanceKm: 4.01,
        feeCents: 441,
      }),
    });

    await expect(service.validate(location)).resolves.toEqual({
      serviceable: false,
      reason: 'OUTSIDE_RADIUS',
      distanceMeters: 4_010,
      distanceMethod: 'route',
      radiusMeters: null,
      storeId: null,
      deliveryFeeCents: 441,
      estimatedMinutes: null,
      quoteId: null,
      expiresAt: null,
    });
  });

  it('maps public configuration failure to a safe retryable network error', async () => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => jsonResponse(
        publicError('CONFIGURATION_UNAVAILABLE'),
        { status: 400 },
      ),
    });

    await expect(service.validate(location)).rejects.toMatchObject({
      name: 'LocationDomainError',
      detail: {
        code: 'NETWORK_ERROR',
        operation: 'service_area',
        recoverable: true,
        causeCode: 'CONFIGURATION_UNAVAILABLE',
      },
    });
  });

  it('maps invalid coordinates to ADDRESS_INVALID without issuing HTTP', async () => {
    const fetch = vi.fn(async () => jsonResponse({
      withinArea: true,
      routeDistanceKm: 1,
      feeCents: 260,
    }));
    const service = new DeliveryQuoteServiceAreaAdapter({ fetch });

    await expect(service.validate({
      ...location,
      coordinates: { ...location.coordinates, latitude: Number.NaN },
    })).rejects.toMatchObject({
      name: 'LocationDomainError',
      detail: { code: 'ADDRESS_INVALID', operation: 'service_area' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not promote a response correlation ID to an operational quote ID', async () => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => jsonResponse({
        withinArea: true,
        routeDistanceKm: 2.5,
        feeCents: 350,
      }),
    });

    const result = await service.validate(location);

    expect(result.quoteId).toBeNull();
    expect(JSON.stringify(result)).not.toContain(CORRELATION_ID);
  });

  it('maps timeout to the existing service-area timeout domain error', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(
      (_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(
        init.signal?.reason ?? new DOMException('Aborted', 'AbortError'),
      )),
    ));
    const service = new DeliveryQuoteServiceAreaAdapter({ fetch, timeoutMs: 50 });
    const request = service.validate(location);
    const assertion = expect(request).rejects.toMatchObject({
      name: 'LocationDomainError',
      detail: { code: 'POSITION_TIMEOUT', operation: 'service_area' },
    });

    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });

  it('normalizes an unexpected transport failure without leaking its message', async () => {
    const service = new DeliveryQuoteServiceAreaAdapter({
      fetch: async () => { throw new Error('SQL /private/inventory'); },
    });

    const request = service.validate(location);
    await expect(request).rejects.toBeInstanceOf(LocationDomainError);
    await expect(request).rejects.toMatchObject({
      detail: {
        code: 'NETWORK_ERROR',
        operation: 'service_area',
        causeCode: 'NETWORK_ERROR',
      },
    });
  });
});
