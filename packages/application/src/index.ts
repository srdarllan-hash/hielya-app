export type PublicAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE';

export * from './auth';

export type AddressType = 'HOME' | 'HOTEL' | 'BUSINESS' | 'OTHER';

export type PublicErrorCode =
  | 'INVALID_INPUT'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'COMPOSITE_COMPONENT_UNAVAILABLE'
  | 'MINIMUM_NOT_REACHED'
  | 'INVALID_DISTANCE'
  | 'OUT_OF_AREA'
  | 'CONFIGURATION_UNAVAILABLE';

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  imageUrl?: string | null;
}

export interface PublicBundleComponent {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface PublicProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  salePriceCents: number;
  currency: 'EUR';
  availability: PublicAvailability;
  isPack: boolean;
  iceIncluded: boolean;
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge?: number | null;
  bundleComponents?: readonly PublicBundleComponent[];
}

export interface PublicProductPage {
  items: readonly PublicProduct[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DeliveryQuoteRequest {
  latitude: number;
  longitude: number;
  addressType?: AddressType;
}

export interface DeliveryQuote {
  withinArea: boolean;
  routeDistanceKm: number;
  feeCents: number;
  publicSpaceBlocked?: boolean;
}

export interface PublicError {
  code: PublicErrorCode;
  message: string;
  correlationId: string;
  field?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ListPublicProductsQuery {
  q?: string;
  category?: string;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export type Awaitable<T> = T | Promise<T>;

export interface CatalogQueryPort {
  listPublicCategories(): Awaitable<readonly PublicCategory[]>;
  listPublicProducts(): Awaitable<readonly PublicProduct[]>;
  findPublicProductById(productId: string): Awaitable<PublicProduct | undefined>;
}

export interface DeliverySettings {
  deliveryBaseFeeCents: number;
  deliveryFeePerKmCents: number;
  maximumRoadDistanceKm: number;
}

export interface OperationalSettingsReadPort {
  getDeliverySettings(): Awaitable<DeliverySettings>;
}

export interface RoutingDistancePort {
  getRoadDistanceKm(request: DeliveryQuoteRequest): Awaitable<number>;
}

export interface CorrelationIdPort {
  generate(): string;
}

export class PublicApiError extends Error {
  readonly code: PublicErrorCode;
  readonly field?: string;
  readonly httpStatus: 400 | 404;

  constructor(
    code: PublicErrorCode,
    message: string,
    options: { field?: string; httpStatus?: 400 | 404 } = {},
  ) {
    super(message);
    this.name = 'PublicApiError';
    this.code = code;
    this.field = options.field;
    this.httpStatus = options.httpStatus ?? 400;
  }
}

const finiteInteger = (value: number): boolean => Number.isFinite(value) && Number.isInteger(value);

export class ListPublicCategories {
  constructor(private readonly catalog: CatalogQueryPort) {}

  async execute(): Promise<readonly PublicCategory[]> {
    const categories = await this.catalog.listPublicCategories();
    return [...categories].sort((left, right) => (
      left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug)
    ));
  }
}

export class ListPublicProducts {
  constructor(private readonly catalog: CatalogQueryPort) {}

  async execute(query: ListPublicProductsQuery = {}): Promise<PublicProductPage> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    if (!finiteInteger(page) || page < 1) {
      throw new PublicApiError('INVALID_INPUT', 'The page parameter is invalid.', { field: 'page' });
    }
    if (!finiteInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new PublicApiError('INVALID_INPUT', 'The pageSize parameter is invalid.', { field: 'pageSize' });
    }

    const [categories, products] = await Promise.all([
      this.catalog.listPublicCategories(),
      this.catalog.listPublicProducts(),
    ]);
    const normalizedQuery = query.q?.trim().toLocaleLowerCase('es');
    const categoryFilter = query.category?.trim();
    const categoryId = categoryFilter
      ? categories.find((category) => (
        category.id === categoryFilter || category.slug === categoryFilter
      ))?.id
      : undefined;

    const filtered = products.filter((product) => {
      if (categoryFilter && product.categoryId !== categoryId) return false;
      if (query.availableOnly === true && product.availability !== 'AVAILABLE') return false;
      if (normalizedQuery) {
        const sku = product.sku.toLocaleLowerCase('es');
        const name = product.name.toLocaleLowerCase('es');
        if (!sku.includes(normalizedQuery) && !name.includes(normalizedQuery)) return false;
      }
      return true;
    });
    const offset = (page - 1) * pageSize;
    return {
      items: filtered.slice(offset, offset + pageSize),
      page,
      pageSize,
      total: filtered.length,
    };
  }
}

export class GetPublicProduct {
  constructor(private readonly catalog: CatalogQueryPort) {}

  async execute(productId: string): Promise<PublicProduct> {
    const product = await this.catalog.findPublicProductById(productId);
    if (!product) {
      throw new PublicApiError('PRODUCT_NOT_FOUND', 'The requested product was not found.', {
        field: 'productId',
        httpStatus: 404,
      });
    }
    return product;
  }
}

const validLatitude = (value: number): boolean => Number.isFinite(value) && value >= -90 && value <= 90;
const validLongitude = (value: number): boolean => Number.isFinite(value) && value >= -180 && value <= 180;

export class QuoteSimulatedDelivery {
  constructor(
    private readonly settings: OperationalSettingsReadPort,
    private readonly routing: RoutingDistancePort,
  ) {}

  async execute(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    if (!validLatitude(request.latitude)) {
      throw new PublicApiError('INVALID_INPUT', 'The latitude is invalid.', { field: 'latitude' });
    }
    if (!validLongitude(request.longitude)) {
      throw new PublicApiError('INVALID_INPUT', 'The longitude is invalid.', { field: 'longitude' });
    }

    let settings: DeliverySettings;
    let routeDistanceKm: number;
    try {
      [settings, routeDistanceKm] = await Promise.all([
        this.settings.getDeliverySettings(),
        this.routing.getRoadDistanceKm(request),
      ]);
    } catch {
      throw new PublicApiError(
        'CONFIGURATION_UNAVAILABLE',
        'The delivery quote is temporarily unavailable.',
      );
    }

    if (
      !Number.isInteger(settings.deliveryBaseFeeCents)
      || settings.deliveryBaseFeeCents < 0
      || !Number.isInteger(settings.deliveryFeePerKmCents)
      || settings.deliveryFeePerKmCents < 0
      || !Number.isFinite(settings.maximumRoadDistanceKm)
      || settings.maximumRoadDistanceKm < 0
    ) {
      throw new PublicApiError(
        'CONFIGURATION_UNAVAILABLE',
        'The delivery quote is temporarily unavailable.',
      );
    }
    if (!Number.isFinite(routeDistanceKm) || routeDistanceKm < 0) {
      throw new PublicApiError(
        'CONFIGURATION_UNAVAILABLE',
        'The delivery quote is temporarily unavailable.',
      );
    }
    if (routeDistanceKm > settings.maximumRoadDistanceKm) {
      throw new PublicApiError('OUT_OF_AREA', 'The address is outside the delivery area.');
    }

    return {
      withinArea: true,
      routeDistanceKm,
      feeCents: Math.round(
        settings.deliveryBaseFeeCents + settings.deliveryFeePerKmCents * routeDistanceKm,
      ),
    };
  }
}
