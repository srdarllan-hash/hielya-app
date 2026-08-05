import type {
  CorrelationIdPort,
  DeliveryQuoteRequest,
  GetPublicProduct,
  ListPublicCategories,
  ListPublicProducts,
  PublicError,
  QuoteSimulatedDelivery,
} from '@hielya/application';
import { PublicApiError } from '@hielya/application';

const MAX_JSON_BODY_BYTES = 16 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS_TYPES = new Set(['HOME', 'HOTEL', 'BUSINESS', 'OTHER']);
const PRODUCT_QUERY_PARAMETERS = new Set(['q', 'category', 'availableOnly', 'page', 'pageSize']);

type ListCategoriesService = Pick<ListPublicCategories, 'execute'>;
type ListProductsService = Pick<ListPublicProducts, 'execute'>;
type GetProductService = Pick<GetPublicProduct, 'execute'>;
type QuoteDeliveryService = Pick<QuoteSimulatedDelivery, 'execute'>;

export interface PublicApiHandlerDependencies {
  listCategories: ListCategoriesService;
  listProducts: ListProductsService;
  getProduct: GetProductService;
  quoteDelivery: QuoteDeliveryService;
  correlationIds: CorrelationIdPort;
}

export interface PublicApiHandlers {
  listCategories(request: Request): Promise<Response>;
  listProducts(request: Request): Promise<Response>;
  getProduct(request: Request, productId: string): Promise<Response>;
  quoteDelivery(request: Request): Promise<Response>;
}

const jsonResponse = (body: unknown, status: number, correlationId: string): Response => Response.json(
  body,
  {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-correlation-id': correlationId,
    },
  },
);

const requestCorrelationId = (request: Request, generator: CorrelationIdPort): string => {
  const supplied = request.headers.get('x-correlation-id');
  return supplied && UUID_PATTERN.test(supplied) ? supplied : generator.generate();
};

const controlledError = (error: unknown, correlationId: string): Response => {
  if (error instanceof PublicApiError) {
    const body: PublicError = {
      code: error.code,
      message: error.message,
      correlationId,
      ...(error.field ? { field: error.field } : {}),
    };
    return jsonResponse(body, error.httpStatus, correlationId);
  }

  const body: PublicError = {
    code: 'CONFIGURATION_UNAVAILABLE',
    message: 'The requested service is temporarily unavailable.',
    correlationId,
  };
  return jsonResponse(body, 400, correlationId);
};

const integerQuery = (parameters: URLSearchParams, name: string): number | undefined => {
  const raw = parameters.get(name);
  if (raw === null) return undefined;
  if (!/^\d+$/.test(raw)) {
    throw new PublicApiError('INVALID_INPUT', `The ${name} parameter is invalid.`, { field: name });
  }
  return Number(raw);
};

const booleanQuery = (parameters: URLSearchParams, name: string): boolean | undefined => {
  const raw = parameters.get(name);
  if (raw === null) return undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new PublicApiError('INVALID_INPUT', `The ${name} parameter is invalid.`, { field: name });
};

const rejectUnsupportedQueryParameters = (
  request: Request,
  allowed: ReadonlySet<string>,
): URLSearchParams => {
  const parameters = new URL(request.url).searchParams;
  const unsupported = [...parameters.keys()].find((name) => !allowed.has(name));
  if (unsupported) {
    throw new PublicApiError('INVALID_INPUT', 'The request contains an unsupported parameter.', {
      field: unsupported,
    });
  }
  const duplicate = [...allowed].find((name) => parameters.getAll(name).length > 1);
  if (duplicate) {
    throw new PublicApiError('INVALID_INPUT', 'The request contains a repeated parameter.', {
      field: duplicate,
    });
  }
  return parameters;
};

const parseDeliveryRequest = async (request: Request): Promise<DeliveryQuoteRequest> => {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > MAX_JSON_BODY_BYTES) {
    throw new PublicApiError('INVALID_INPUT', 'The request body is too large.');
  }

  const source = await request.text();
  if (new TextEncoder().encode(source).byteLength > MAX_JSON_BODY_BYTES) {
    throw new PublicApiError('INVALID_INPUT', 'The request body is too large.');
  }

  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new PublicApiError('INVALID_INPUT', 'The request body must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PublicApiError('INVALID_INPUT', 'The request body is invalid.');
  }

  const input = value as Record<string, unknown>;
  const allowed = new Set(['latitude', 'longitude', 'addressType']);
  const unsupported = Object.keys(input).find((key) => !allowed.has(key));
  if (unsupported) {
    throw new PublicApiError('INVALID_INPUT', 'The request contains an unsupported field.', {
      field: unsupported,
    });
  }
  if (typeof input.latitude !== 'number') {
    throw new PublicApiError('INVALID_INPUT', 'The latitude is invalid.', { field: 'latitude' });
  }
  if (typeof input.longitude !== 'number') {
    throw new PublicApiError('INVALID_INPUT', 'The longitude is invalid.', { field: 'longitude' });
  }
  if (input.addressType !== undefined && (
    typeof input.addressType !== 'string' || !ADDRESS_TYPES.has(input.addressType)
  )) {
    throw new PublicApiError('INVALID_INPUT', 'The addressType is invalid.', { field: 'addressType' });
  }

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    ...(input.addressType ? { addressType: input.addressType as DeliveryQuoteRequest['addressType'] } : {}),
  };
};

export const createPublicApiHandlers = (
  dependencies: PublicApiHandlerDependencies,
): PublicApiHandlers => ({
  async listCategories(request) {
    const correlationId = requestCorrelationId(request, dependencies.correlationIds);
    try {
      rejectUnsupportedQueryParameters(request, new Set());
      return jsonResponse(await dependencies.listCategories.execute(), 200, correlationId);
    } catch (error) {
      return controlledError(error, correlationId);
    }
  },

  async listProducts(request) {
    const correlationId = requestCorrelationId(request, dependencies.correlationIds);
    try {
      const parameters = rejectUnsupportedQueryParameters(request, PRODUCT_QUERY_PARAMETERS);
      const result = await dependencies.listProducts.execute({
        ...(parameters.has('q') ? { q: parameters.get('q') ?? undefined } : {}),
        ...(parameters.has('category') ? { category: parameters.get('category') ?? undefined } : {}),
        ...(parameters.has('availableOnly')
          ? { availableOnly: booleanQuery(parameters, 'availableOnly') }
          : {}),
        ...(parameters.has('page') ? { page: integerQuery(parameters, 'page') } : {}),
        ...(parameters.has('pageSize') ? { pageSize: integerQuery(parameters, 'pageSize') } : {}),
      });
      return jsonResponse(result, 200, correlationId);
    } catch (error) {
      return controlledError(error, correlationId);
    }
  },

  async getProduct(request, productId) {
    const correlationId = requestCorrelationId(request, dependencies.correlationIds);
    try {
      rejectUnsupportedQueryParameters(request, new Set());
      if (!UUID_PATTERN.test(productId)) {
        throw new PublicApiError('PRODUCT_NOT_FOUND', 'The requested product was not found.', {
          field: 'productId',
          httpStatus: 404,
        });
      }
      return jsonResponse(await dependencies.getProduct.execute(productId), 200, correlationId);
    } catch (error) {
      return controlledError(error, correlationId);
    }
  },

  async quoteDelivery(request) {
    const correlationId = requestCorrelationId(request, dependencies.correlationIds);
    try {
      rejectUnsupportedQueryParameters(request, new Set());
      const input = await parseDeliveryRequest(request);
      return jsonResponse(await dependencies.quoteDelivery.execute(input), 200, correlationId);
    } catch (error) {
      return controlledError(error, correlationId);
    }
  },
});
