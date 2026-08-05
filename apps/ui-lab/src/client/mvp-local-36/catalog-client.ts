import {
  PUBLIC_AVAILABILITIES,
  PUBLIC_ERROR_CODES,
  type CatalogProductsQuery,
  type CatalogRequestOptions,
  type CatalogResponse,
  type PublicBundleComponentDto,
  type PublicCategoryDto,
  type PublicErrorDto,
  type PublicProductDto,
  type PublicProductPageDto,
} from './catalog-contracts';

const CATEGORY_ENDPOINT = '/api/v1/catalog/categories';
const PRODUCTS_ENDPOINT = '/api/v1/catalog/products';
const DEFAULT_TIMEOUT_MS = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type CatalogClientErrorKind =
  | 'ABORTED'
  | 'HTTP_ERROR'
  | 'INVALID_PAYLOAD'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

export class CatalogClientError extends Error {
  constructor(
    readonly kind: CatalogClientErrorKind,
    message: string,
    readonly options: {
      status?: number;
      correlationId?: string | null;
      publicError?: PublicErrorDto;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CatalogClientError';
  }
}

export interface MvpCatalogClient {
  listCategories(
    options?: CatalogRequestOptions,
  ): Promise<CatalogResponse<readonly PublicCategoryDto[]>>;
  listProducts(
    query?: CatalogProductsQuery,
    options?: CatalogRequestOptions,
  ): Promise<CatalogResponse<PublicProductPageDto>>;
}

export interface MvpProductDetailClient {
  getProduct(
    productId: string,
    options?: CatalogRequestOptions,
  ): Promise<CatalogResponse<PublicProductDto>>;
}

export type MvpPublicCatalogClient = MvpCatalogClient & MvpProductDetailClient;

export interface CreateMvpCatalogClientOptions {
  fetch?: FetchImplementation;
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

const isNonEmptyString = (value: unknown): value is string => (
  typeof value === 'string' && value.length > 0
);

const isNonNegativeInteger = (value: unknown): value is number => (
  typeof value === 'number' && Number.isInteger(value) && value >= 0
);

const isPositiveInteger = (value: unknown): value is number => (
  typeof value === 'number' && Number.isInteger(value) && value >= 1
);

const isNullableString = (value: unknown): value is string | null => (
  value === null || typeof value === 'string'
);

const isNullableNonNegativeNumber = (value: unknown): value is number | null => (
  value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
);

const isNullableUri = (value: unknown): value is string | null => {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isPublicCategory = (value: unknown): value is PublicCategoryDto => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['id', 'slug', 'name', 'sortOrder', 'imageUrl'])) {
    return false;
  }
  return isUuid(value.id)
    && isNonEmptyString(value.slug)
    && isNonEmptyString(value.name)
    && typeof value.sortOrder === 'number'
    && Number.isInteger(value.sortOrder)
    && (value.imageUrl === undefined || isNullableUri(value.imageUrl));
};

const isPublicBundleComponent = (value: unknown): value is PublicBundleComponentDto => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['productId', 'sku', 'name', 'quantity'])) {
    return false;
  }
  return isUuid(value.productId)
    && isNonEmptyString(value.sku)
    && isNonEmptyString(value.name)
    && isPositiveInteger(value.quantity);
};

const isPublicProduct = (value: unknown): value is PublicProductDto => {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'id',
    'sku',
    'ean',
    'name',
    'description',
    'brand',
    'categoryId',
    'subcategory',
    'volumeLabel',
    'grossWeightKg',
    'estimatedVolumeLiters',
    'salePriceCents',
    'currency',
    'unitPriceLabel',
    'availability',
    'isPack',
    'iceIncluded',
    'maxPerOrder',
    'temperatureProfile',
    'readyToConsume',
    'containsAlcohol',
    'minimumAge',
    'alcoholPercentage',
    'imageUrl',
    'keywords',
    'bundleComponents',
  ])) {
    return false;
  }

  const validComponents = value.bundleComponents === undefined || (
    Array.isArray(value.bundleComponents)
    && value.bundleComponents.every(isPublicBundleComponent)
  );
  const validMinimumAge = value.minimumAge === undefined
    || value.minimumAge === null
    || (typeof value.minimumAge === 'number'
      && Number.isInteger(value.minimumAge)
      && value.minimumAge >= 18);
  const validTemperature = value.temperatureProfile === undefined
    || value.temperatureProfile === null
    || value.temperatureProfile === 'CHILLED'
    || value.temperatureProfile === 'FROZEN'
    || value.temperatureProfile === 'CELLAR'
    || value.temperatureProfile === 'AMBIENT';
  const validPack = value.isPack !== true || (
    value.iceIncluded === true
    && Array.isArray(value.bundleComponents)
    && value.bundleComponents.length > 0
  );

  return isUuid(value.id)
    && isNonEmptyString(value.sku)
    && (value.ean === undefined || isNullableString(value.ean))
    && isNonEmptyString(value.name)
    && (value.description === undefined || isNullableString(value.description))
    && (value.brand === undefined || isNullableString(value.brand))
    && isUuid(value.categoryId)
    && (value.subcategory === undefined || isNullableString(value.subcategory))
    && (value.volumeLabel === undefined || isNullableString(value.volumeLabel))
    && (value.grossWeightKg === undefined || isNullableNonNegativeNumber(value.grossWeightKg))
    && (value.estimatedVolumeLiters === undefined
      || isNullableNonNegativeNumber(value.estimatedVolumeLiters))
    && isNonNegativeInteger(value.salePriceCents)
    && value.currency === 'EUR'
    && (value.unitPriceLabel === undefined || isNullableString(value.unitPriceLabel))
    && typeof value.availability === 'string'
    && PUBLIC_AVAILABILITIES.includes(value.availability as PublicProductDto['availability'])
    && typeof value.isPack === 'boolean'
    && typeof value.iceIncluded === 'boolean'
    && isPositiveInteger(value.maxPerOrder)
    && validTemperature
    && (value.readyToConsume === undefined || typeof value.readyToConsume === 'boolean')
    && typeof value.containsAlcohol === 'boolean'
    && validMinimumAge
    && (value.alcoholPercentage === undefined
      || isNullableNonNegativeNumber(value.alcoholPercentage))
    && (value.imageUrl === undefined || isNullableUri(value.imageUrl))
    && (value.keywords === undefined
      || (Array.isArray(value.keywords)
        && value.keywords.every((keyword) => typeof keyword === 'string')))
    && validComponents
    && validPack;
};

const parseCategories = (value: unknown): readonly PublicCategoryDto[] | undefined => (
  Array.isArray(value) && value.every(isPublicCategory) ? value : undefined
);

const parseProductPage = (value: unknown): PublicProductPageDto | undefined => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['items', 'page', 'pageSize', 'total'])) {
    return undefined;
  }
  if (
    !Array.isArray(value.items)
    || !value.items.every(isPublicProduct)
    || !isPositiveInteger(value.page)
    || !isPositiveInteger(value.pageSize)
    || value.pageSize > 100
    || !isNonNegativeInteger(value.total)
  ) {
    return undefined;
  }
  return {
    items: value.items,
    page: value.page,
    pageSize: value.pageSize,
    total: value.total,
  };
};

const parseProduct = (value: unknown): PublicProductDto | undefined => (
  isPublicProduct(value) ? value : undefined
);

const parsePublicError = (value: unknown): PublicErrorDto | undefined => {
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
    || !PUBLIC_ERROR_CODES.includes(value.code as PublicErrorDto['code'])
    || !isNonEmptyString(value.message)
    || !isUuid(value.correlationId)
    || (value.field !== undefined && !isNullableString(value.field))
    || (value.details !== undefined && value.details !== null && !isRecord(value.details))
  ) {
    return undefined;
  }
  return {
    code: value.code as PublicErrorDto['code'],
    message: value.message,
    correlationId: value.correlationId,
    ...(value.field !== undefined ? { field: value.field as string | null } : {}),
    ...(value.details !== undefined
      ? { details: value.details as Record<string, unknown> | null }
      : {}),
  };
};

const safeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const positiveTimeout = (value: number | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  if (!Number.isFinite(value) || value <= 0) {
    throw new CatalogClientError('INVALID_PAYLOAD', 'The request timeout is invalid.');
  }
  return value;
};

const productsUrl = (query: CatalogProductsQuery): string => {
  const parameters = new URLSearchParams();
  if (query.q !== undefined) parameters.set('q', query.q);
  if (query.category !== undefined) parameters.set('category', query.category);
  if (query.availableOnly !== undefined) {
    parameters.set('availableOnly', String(query.availableOnly));
  }
  if (query.page !== undefined) parameters.set('page', String(query.page));
  if (query.pageSize !== undefined) parameters.set('pageSize', String(query.pageSize));
  const queryString = parameters.toString();
  return queryString ? `${PRODUCTS_ENDPOINT}?${queryString}` : PRODUCTS_ENDPOINT;
};

const productUrl = (productId: string): string => {
  if (!isUuid(productId)) {
    throw new CatalogClientError('INVALID_PAYLOAD', 'The product identifier is invalid.');
  }
  return `${PRODUCTS_ENDPOINT}/${productId}`;
};

const requestHeaders = (correlationId: string | undefined): HeadersInit => (
  correlationId ? { 'x-correlation-id': correlationId } : {}
);

export const createMvpCatalogClient = (
  options: CreateMvpCatalogClientOptions = {},
): MvpPublicCatalogClient => {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  const defaultTimeoutMs = positiveTimeout(options.defaultTimeoutMs, DEFAULT_TIMEOUT_MS);

  const get = async <T>(
    url: string,
    parse: (value: unknown) => T | undefined,
    requestOptions: CatalogRequestOptions,
  ): Promise<CatalogResponse<T>> => {
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort(requestOptions.signal?.reason);
    if (requestOptions.signal?.aborted) {
      forwardAbort();
    } else {
      requestOptions.signal?.addEventListener('abort', forwardAbort, { once: true });
    }

    const timeoutMs = positiveTimeout(requestOptions.timeoutMs, defaultTimeoutMs);
    const timeoutId = globalThis.setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException('The request timed out.', 'TimeoutError'));
    }, timeoutMs);

    try {
      const response = await fetchImplementation(url, {
        method: 'GET',
        headers: requestHeaders(requestOptions.correlationId),
        signal: controller.signal,
      });
      const responseCorrelationId = response.headers.get('x-correlation-id');
      const payload = await safeJson(response);

      if (!response.ok) {
        const publicError = parsePublicError(payload);
        throw new CatalogClientError(
          'HTTP_ERROR',
          publicError?.message ?? 'The catalog request failed.',
          {
            status: response.status,
            correlationId: publicError?.correlationId ?? responseCorrelationId,
            ...(publicError ? { publicError } : {}),
          },
        );
      }

      const data = parse(payload);
      if (data === undefined) {
        throw new CatalogClientError(
          'INVALID_PAYLOAD',
          'The catalog response is invalid.',
          { correlationId: responseCorrelationId },
        );
      }
      return { data, correlationId: responseCorrelationId };
    } catch (error) {
      if (error instanceof CatalogClientError) throw error;
      if (timedOut) {
        throw new CatalogClientError('TIMEOUT', 'The catalog request timed out.', { cause: error });
      }
      if (controller.signal.aborted || requestOptions.signal?.aborted) {
        throw new CatalogClientError('ABORTED', 'The catalog request was cancelled.', { cause: error });
      }
      throw new CatalogClientError('NETWORK_ERROR', 'The catalog request failed.', { cause: error });
    } finally {
      globalThis.clearTimeout(timeoutId);
      requestOptions.signal?.removeEventListener('abort', forwardAbort);
    }
  };

  return {
    listCategories(requestOptions = {}) {
      return get(CATEGORY_ENDPOINT, parseCategories, requestOptions);
    },
    listProducts(query = {}, requestOptions = {}) {
      return get(productsUrl(query), parseProductPage, requestOptions);
    },
    async getProduct(productId, requestOptions = {}) {
      const response = await get(productUrl(productId), parseProduct, requestOptions);
      if (response.data.id !== productId) {
        throw new CatalogClientError(
          'INVALID_PAYLOAD',
          'The catalog response is invalid.',
          { correlationId: response.correlationId },
        );
      }
      return response;
    },
  };
};
