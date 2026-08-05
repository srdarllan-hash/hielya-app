export const PUBLIC_AVAILABILITIES = [
  'AVAILABLE',
  'UNAVAILABLE',
  'TEMPORARILY_UNAVAILABLE',
] as const;

export type PublicAvailability = (typeof PUBLIC_AVAILABILITIES)[number];

export const PUBLIC_ERROR_CODES = [
  'INVALID_INPUT',
  'PRODUCT_NOT_FOUND',
  'PRODUCT_UNAVAILABLE',
  'COMPOSITE_COMPONENT_UNAVAILABLE',
  'MINIMUM_NOT_REACHED',
  'INVALID_DISTANCE',
  'OUT_OF_AREA',
  'CONFIGURATION_UNAVAILABLE',
] as const;

export type PublicErrorCode = (typeof PUBLIC_ERROR_CODES)[number];

export interface PublicCategoryDto {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  imageUrl?: string | null;
}

export interface PublicBundleComponentDto {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface PublicProductDto {
  id: string;
  sku: string;
  ean?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  categoryId: string;
  subcategory?: string | null;
  volumeLabel?: string | null;
  grossWeightKg?: number | null;
  estimatedVolumeLiters?: number | null;
  salePriceCents: number;
  currency: 'EUR';
  unitPriceLabel?: string | null;
  availability: PublicAvailability;
  isPack: boolean;
  iceIncluded: boolean;
  maxPerOrder: number;
  temperatureProfile?: 'CHILLED' | 'FROZEN' | 'CELLAR' | 'AMBIENT' | null;
  readyToConsume?: boolean;
  containsAlcohol: boolean;
  minimumAge?: number | null;
  alcoholPercentage?: number | null;
  imageUrl?: string | null;
  keywords?: readonly string[];
  bundleComponents?: readonly PublicBundleComponentDto[];
}

export interface PublicProductPageDto {
  items: readonly PublicProductDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PublicErrorDto {
  code: PublicErrorCode;
  message: string;
  correlationId: string;
  field?: string | null;
  details?: Record<string, unknown> | null;
}

export interface CatalogProductsQuery {
  q?: string;
  category?: string;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CatalogRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  correlationId?: string;
}

export interface CatalogResponse<T> {
  data: T;
  correlationId: string | null;
}
