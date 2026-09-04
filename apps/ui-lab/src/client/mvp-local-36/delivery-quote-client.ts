const DELIVERY_QUOTE_ENDPOINT = '/api/v1/delivery/quote';
const DEFAULT_TIMEOUT_MS = 8_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DELIVERY_QUOTE_ERROR_CODES = [
  'INVALID_INPUT',
  'PRODUCT_NOT_FOUND',
  'PRODUCT_UNAVAILABLE',
  'COMPOSITE_COMPONENT_UNAVAILABLE',
  'MINIMUM_NOT_REACHED',
  'INVALID_DISTANCE',
  'OUT_OF_AREA',
  'CONFIGURATION_UNAVAILABLE',
] as const;

export type DeliveryQuotePublicErrorCode = (typeof DELIVERY_QUOTE_ERROR_CODES)[number];

export interface DeliveryQuoteRequestDto {
  latitude: number;
  longitude: number;
}

export interface DeliveryQuoteDto {
  withinArea: boolean;
  routeDistanceKm: number;
  feeCents: number;
  publicSpaceBlocked?: boolean;
}

export interface DeliveryQuotePublicErrorDto {
  code: DeliveryQuotePublicErrorCode;
  message: string;
  correlationId: string;
  field?: string | null;
  details?: Record<string, unknown> | null;
}

export interface DeliveryQuoteResponse {
  data: DeliveryQuoteDto;
  correlationId: string | null;
}

export interface DeliveryQuoteRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type DeliveryQuoteFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type DeliveryQuoteClientErrorKind =
  | 'ABORTED'
  | 'HTTP_ERROR'
  | 'INVALID_PAYLOAD'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

export class DeliveryQuoteClientError extends Error {
  constructor(
    readonly kind: DeliveryQuoteClientErrorKind,
    message: string,
    readonly options: {
      status?: number;
      correlationId?: string | null;
      publicError?: DeliveryQuotePublicErrorDto;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'DeliveryQuoteClientError';
  }
}

export interface MvpDeliveryQuoteClient {
  quoteDelivery(
    request: DeliveryQuoteRequestDto,
    options?: DeliveryQuoteRequestOptions,
  ): Promise<DeliveryQuoteResponse>;
}

export interface CreateMvpDeliveryQuoteClientOptions {
  fetch?: DeliveryQuoteFetch;
  defaultTimeoutMs?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[]): boolean => {
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
};

const isUuid = (value: unknown): value is string => (
  typeof value === 'string' && UUID_PATTERN.test(value)
);

const isFiniteCoordinate = (value: unknown, minimum: number, maximum: number): value is number => (
  typeof value === 'number'
  && Number.isFinite(value)
  && value >= minimum
  && value <= maximum
);

const parseDeliveryQuote = (value: unknown): DeliveryQuoteDto | undefined => {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'withinArea',
    'routeDistanceKm',
    'feeCents',
    'publicSpaceBlocked',
  ])) {
    return undefined;
  }
  const publicSpaceBlocked = value.publicSpaceBlocked;
  if (
    typeof value.withinArea !== 'boolean'
    || typeof value.routeDistanceKm !== 'number'
    || !Number.isFinite(value.routeDistanceKm)
    || value.routeDistanceKm < 0
    || typeof value.feeCents !== 'number'
    || !Number.isInteger(value.feeCents)
    || value.feeCents < 0
    || (publicSpaceBlocked !== undefined && typeof publicSpaceBlocked !== 'boolean')
  ) {
    return undefined;
  }
  const quote: DeliveryQuoteDto = {
    withinArea: value.withinArea,
    routeDistanceKm: value.routeDistanceKm,
    feeCents: value.feeCents,
  };
  if (typeof publicSpaceBlocked === 'boolean') {
    quote.publicSpaceBlocked = publicSpaceBlocked;
  }
  return quote;
};

const parsePublicError = (value: unknown): DeliveryQuotePublicErrorDto | undefined => {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'code',
    'message',
    'correlationId',
    'field',
    'details',
  ])) {
    return undefined;
  }
  if (
    typeof value.code !== 'string'
    || !DELIVERY_QUOTE_ERROR_CODES.includes(value.code as DeliveryQuotePublicErrorCode)
    || typeof value.message !== 'string'
    || value.message.length === 0
    || !isUuid(value.correlationId)
    || (value.field !== undefined && value.field !== null && typeof value.field !== 'string')
    || (value.details !== undefined && value.details !== null && !isRecord(value.details))
  ) {
    return undefined;
  }
  return {
    code: value.code as DeliveryQuotePublicErrorCode,
    message: value.message,
    correlationId: value.correlationId,
    ...(value.field === undefined ? {} : { field: value.field as string | null }),
    ...(value.details === undefined
      ? {}
      : { details: value.details as Record<string, unknown> | null }),
  };
};

const safeJson = async (response: Response, signal: AbortSignal): Promise<unknown> => {
  try {
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    return undefined;
  }
};

const isJsonResponse = (response: Response): boolean => (
  /^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')
);

const positiveTimeout = (value: number | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new DeliveryQuoteClientError('INVALID_PAYLOAD', 'The request timeout is invalid.');
  }
  return value;
};

const validateRequest = (request: DeliveryQuoteRequestDto): void => {
  if (!isFiniteCoordinate(request.latitude, -90, 90)) {
    throw new DeliveryQuoteClientError('INVALID_PAYLOAD', 'The latitude is invalid.');
  }
  if (!isFiniteCoordinate(request.longitude, -180, 180)) {
    throw new DeliveryQuoteClientError('INVALID_PAYLOAD', 'The longitude is invalid.');
  }
};

const responseCorrelationId = (response: Response): string | null => {
  const value = response.headers.get('x-correlation-id');
  return isUuid(value) ? value : null;
};

export const createMvpDeliveryQuoteClient = (
  options: CreateMvpDeliveryQuoteClientOptions = {},
): MvpDeliveryQuoteClient => {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  const defaultTimeoutMs = positiveTimeout(options.defaultTimeoutMs, DEFAULT_TIMEOUT_MS);

  return {
    async quoteDelivery(request, requestOptions = {}) {
      validateRequest(request);
      if (requestOptions.signal?.aborted) {
        throw new DeliveryQuoteClientError('ABORTED', 'The delivery quote request was cancelled.');
      }

      const controller = new AbortController();
      let timedOut = false;
      const forwardAbort = () => controller.abort(requestOptions.signal?.reason);
      requestOptions.signal?.addEventListener('abort', forwardAbort, { once: true });
      const timeoutMs = positiveTimeout(requestOptions.timeoutMs, defaultTimeoutMs);
      const timeoutId = globalThis.setTimeout(() => {
        timedOut = true;
        controller.abort(new DOMException('The request timed out.', 'TimeoutError'));
      }, timeoutMs);

      try {
        const response = await fetchImplementation(DELIVERY_QUOTE_ENDPOINT, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            latitude: request.latitude,
            longitude: request.longitude,
          }),
          signal: controller.signal,
        });
        const correlationId = responseCorrelationId(response);
        const payload = isJsonResponse(response)
          ? await safeJson(response, controller.signal)
          : undefined;

        if (response.status !== 200) {
          const publicError = response.status === 400 ? parsePublicError(payload) : undefined;
          throw new DeliveryQuoteClientError(
            'HTTP_ERROR',
            publicError?.message ?? 'The delivery quote request failed.',
            {
              status: response.status,
              correlationId: publicError?.correlationId ?? correlationId,
              ...(publicError ? { publicError } : {}),
            },
          );
        }

        const data = parseDeliveryQuote(payload);
        if (!data) {
          throw new DeliveryQuoteClientError(
            'INVALID_PAYLOAD',
            'The delivery quote response is invalid.',
            { correlationId },
          );
        }
        return { data, correlationId };
      } catch (error) {
        if (error instanceof DeliveryQuoteClientError) throw error;
        if (timedOut) {
          throw new DeliveryQuoteClientError(
            'TIMEOUT',
            'The delivery quote request timed out.',
            { cause: error },
          );
        }
        if (controller.signal.aborted || requestOptions.signal?.aborted) {
          throw new DeliveryQuoteClientError(
            'ABORTED',
            'The delivery quote request was cancelled.',
            { cause: error },
          );
        }
        throw new DeliveryQuoteClientError(
          'NETWORK_ERROR',
          'The delivery quote request failed.',
          { cause: error },
        );
      } finally {
        globalThis.clearTimeout(timeoutId);
        requestOptions.signal?.removeEventListener('abort', forwardAbort);
      }
    },
  };
};
