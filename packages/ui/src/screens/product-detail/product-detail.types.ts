export const PRODUCT_DETAIL_STATES = [
  'PRODUCT_DETAIL_LOADING',
  'PRODUCT_DETAIL_READY',
  'PRODUCT_DETAIL_NOT_FOUND',
  'PRODUCT_DETAIL_ERROR',
] as const;

export type ProductDetailState = (typeof PRODUCT_DETAIL_STATES)[number];

export type ProductDetailAvailability =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'TEMPORARILY_UNAVAILABLE';

export interface ProductDetailBundleComponentViewModel {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface ProductDetailViewModel {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  price: string;
  unitPriceLabel: string | null;
  volumeLabel: string | null;
  image: string | null;
  availability: ProductDetailAvailability;
  isPack: boolean;
  iceIncluded: boolean;
  maxPerOrder: number;
  containsAlcohol: boolean;
  minimumAge: number | null;
  alcoholPercentage: number | null;
  temperatureLabel: string | null;
  readyToConsume: boolean | null;
  bundleComponents: readonly ProductDetailBundleComponentViewModel[];
}
