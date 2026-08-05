export const HOME_STATES = ['ready','loading','closed','high-demand','error','empty-cart','alcohol-cutoff','out-of-area'] as const;
export type HomeState = typeof HOME_STATES[number];
export function coerceHomeState(value?: string): HomeState { return HOME_STATES.includes(value as HomeState) ? value as HomeState : 'ready'; }

export const HOME_CATALOG_STATES = [
  'HOME_CATALOG_LOADING',
  'HOME_CATALOG_READY',
  'HOME_CATALOG_EMPTY',
  'HOME_CATALOG_ERROR',
] as const;

export type HomeCatalogState = typeof HOME_CATALOG_STATES[number];

export type HomeAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE';

export interface HomeCategoryViewModel {
  id: string;
  label: string;
  image?: string | null;
}

export interface HomeUnitProductViewModel {
  kind: 'UNIT';
  id: string;
  name: string;
  price: string;
  volumeLabel?: string | null;
  image?: string | null;
  availability: HomeAvailability;
  containsAlcohol: boolean;
  minimumAge?: number | null;
}

export interface HomePackComponentViewModel {
  productId: string;
  name: string;
  quantity: number;
}

export interface HomePackViewModel {
  kind: 'PACK';
  id: string;
  name: string;
  price: string;
  image?: string | null;
  discountLabel?: string | null;
  availability: HomeAvailability;
  iceIncluded: boolean;
  containsAlcohol: boolean;
  minimumAge?: number | null;
  components: readonly HomePackComponentViewModel[];
}

export interface HomeCatalogViewModel {
  categories: readonly HomeCategoryViewModel[];
  unitProducts: readonly HomeUnitProductViewModel[];
  packs: readonly HomePackViewModel[];
  page: number;
  pageSize: number;
  total: number;
}

export interface HomeDeliverySummaryViewModel {
  blocked: boolean;
  eta?: string;
  addressLine: string;
  localityLine: string;
  deliveryRadiusLabel: string;
  minimumOrderLabel: string;
}

export interface HomeOperationalFactViewModel {
  label: string;
  value: string;
}
