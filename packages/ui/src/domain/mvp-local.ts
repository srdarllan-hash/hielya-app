export const MVP_CATEGORIES = [
  'Cervejas',
  'Refrigerantes',
  'Energéticos',
  'Águas',
  'Destilados',
  'Vinhos e Espumantes',
  'Gelo',
  'Snacks',
  'Conveniência',
] as const;

export type MvpCategory = typeof MVP_CATEGORIES[number];

export interface MvpCatalogItem {
  sku: string;
  category: MvpCategory;
  kind: 'unit' | 'composite';
  componentQuantities?: Readonly<Record<string, number>>;
}

/** Values must be supplied by persistent Admin-managed configuration. */
export interface MvpOperationalSettings {
  minimumProductSubtotalCents: number;
  deliveryBaseFeeCents: number;
  deliveryFeePerKmCents: number;
  maximumRoadDistanceKm: number;
  maximumPinAttempts: number;
  tipsEnabled: boolean;
}

export function getCatalogCategoryCounts(catalog: readonly MvpCatalogItem[]): Record<MvpCategory, number> {
  return MVP_CATEGORIES.reduce((counts, category) => ({
    ...counts,
    [category]: catalog.filter((item) => item.category === category).length,
  }), {} as Record<MvpCategory, number>);
}

export function isMvpCatalogValid(catalog: readonly MvpCatalogItem[]): boolean {
  const skus = new Set(catalog.map((item) => item.sku));
  return catalog.length === 36
    && skus.size === 36
    && catalog.filter((item) => item.kind === 'composite').length === 6
    && catalog.filter((item) => item.kind === 'composite').every((item) => Boolean(item.componentQuantities && Object.keys(item.componentQuantities).some((sku) => sku.startsWith('HYA-GEL-'))));
}

export function quoteSimulatedDelivery(distanceRoadKm: number, settings: MvpOperationalSettings): { eligible: boolean; feeCents: number | null } {
  if (!Number.isFinite(distanceRoadKm) || distanceRoadKm < 0 || distanceRoadKm > settings.maximumRoadDistanceKm) {
    return { eligible: false, feeCents: null };
  }
  return { eligible: true, feeCents: Math.round(settings.deliveryBaseFeeCents + (settings.deliveryFeePerKmCents * distanceRoadKm)) };
}

export function remainingForMinimum(productSubtotalCents: number, settings: MvpOperationalSettings): number {
  return Math.max(0, settings.minimumProductSubtotalCents - productSubtotalCents);
}

/** Checks components only. Persistent stock reservation must remain transactional. */
export function hasCompositeAvailability(item: MvpCatalogItem, availableBySku: Readonly<Record<string, number>>): boolean {
  if (item.kind !== 'composite' || !item.componentQuantities) return false;
  return Object.entries(item.componentQuantities).every(([sku, quantity]) => Number.isInteger(quantity) && quantity > 0 && (availableBySku[sku] ?? 0) >= quantity);
}

export function generateDeliveryPin(random: () => number = Math.random): string {
  return String(Math.floor(random() * 10000)).padStart(4, '0');
}

export function canCompleteDelivery(pinMatches: boolean, attemptsUsedBeforeValidation: number, settings: MvpOperationalSettings): boolean {
  return pinMatches && attemptsUsedBeforeValidation < settings.maximumPinAttempts;
}
