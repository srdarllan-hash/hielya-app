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

/**
 * The customer-visible MVP selection. Product attributes, prices, images,
 * availability and inventory stay in the operational catalog, not in code.
 */
export const MVP_LOCAL_36_CATALOG: readonly MvpCatalogItem[] = [
  { sku: 'HYA-CER-001', category: 'Cervejas', kind: 'unit' },
  { sku: 'HYA-CER-003', category: 'Cervejas', kind: 'unit' },
  { sku: 'HYA-CER-006', category: 'Cervejas', kind: 'unit' },
  { sku: 'HYA-CER-009', category: 'Cervejas', kind: 'unit' },
  { sku: 'HYA-CMB-001', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-001': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-CMB-002', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-003': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-CMB-003', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-006': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-CMB-004', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-009': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-REF-016', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-017', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-018', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-019', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-020', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-023', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-ENE-026', category: 'Energéticos', kind: 'unit' },
  { sku: 'HYA-ENE-027', category: 'Energéticos', kind: 'unit' },
  { sku: 'HYA-ENE-029', category: 'Energéticos', kind: 'unit' },
  { sku: 'HYA-AGU-032', category: 'Águas', kind: 'unit' },
  { sku: 'HYA-AGU-034', category: 'Águas', kind: 'unit' },
  { sku: 'HYA-DES-036', category: 'Destilados', kind: 'unit' },
  { sku: 'HYA-DES-040', category: 'Destilados', kind: 'unit' },
  { sku: 'HYA-DES-044', category: 'Destilados', kind: 'unit' },
  { sku: 'HYA-CMB-005', category: 'Destilados', kind: 'composite', componentQuantities: { 'HYA-DES-036': 1, 'HYA-REF-023': 4, 'HYA-GEL-052': 1 } },
  { sku: 'HYA-CMB-006', category: 'Destilados', kind: 'composite', componentQuantities: { 'HYA-DES-040': 1, 'HYA-ENE-026': 4, 'HYA-GEL-052': 1 } },
  { sku: 'HYA-VIN-046', category: 'Vinhos e Espumantes', kind: 'unit' },
  { sku: 'HYA-VIN-047', category: 'Vinhos e Espumantes', kind: 'unit' },
  { sku: 'HYA-VIN-049', category: 'Vinhos e Espumantes', kind: 'unit' },
  { sku: 'HYA-GEL-051', category: 'Gelo', kind: 'unit' },
  { sku: 'HYA-GEL-052', category: 'Gelo', kind: 'unit' },
  { sku: 'HYA-SNA-053', category: 'Snacks', kind: 'unit' },
  { sku: 'HYA-SNA-054', category: 'Snacks', kind: 'unit' },
  { sku: 'HYA-SNA-055', category: 'Snacks', kind: 'unit' },
  { sku: 'HYA-SNA-056', category: 'Snacks', kind: 'unit' },
  { sku: 'HYA-CON-058', category: 'Conveniência', kind: 'unit' },
  { sku: 'HYA-CON-059', category: 'Conveniência', kind: 'unit' },
  { sku: 'HYA-CON-060', category: 'Conveniência', kind: 'unit' },
];

export interface MvpOperationalSettings {
  minimumProductSubtotalCents: number;
  deliveryBaseFeeCents: number;
  deliveryFeePerKmCents: number;
  maximumRoadDistanceKm: number;
  maximumPinAttempts: number;
  tipsEnabled: boolean;
}

export function getCatalogCategoryCounts(catalog: readonly MvpCatalogItem[] = MVP_LOCAL_36_CATALOG): Record<MvpCategory, number> {
  return MVP_CATEGORIES.reduce((counts, category) => ({
    ...counts,
    [category]: catalog.filter((item) => item.category === category).length,
  }), {} as Record<MvpCategory, number>);
}

export function isMvpCatalogValid(catalog: readonly MvpCatalogItem[] = MVP_LOCAL_36_CATALOG): boolean {
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
  return {
    eligible: true,
    feeCents: Math.round(settings.deliveryBaseFeeCents + (settings.deliveryFeePerKmCents * distanceRoadKm)),
  };
}

export function remainingForMinimum(productSubtotalCents: number, settings: MvpOperationalSettings): number {
  return Math.max(0, settings.minimumProductSubtotalCents - productSubtotalCents);
}

export function canReserveComposite(item: MvpCatalogItem, availableBySku: Readonly<Record<string, number>>): boolean {
  if (item.kind !== 'composite' || !item.componentQuantities) return false;
  return Object.entries(item.componentQuantities).every(([sku, quantity]) => Number.isInteger(quantity) && quantity > 0 && (availableBySku[sku] ?? 0) >= quantity);
}

export function generateDeliveryPin(random: () => number = Math.random): string {
  return String(Math.floor(random() * 10000)).padStart(4, '0');
}

export function canCompleteDelivery(pinMatches: boolean, attemptsUsedBeforeValidation: number, settings: MvpOperationalSettings): boolean {
  return pinMatches && attemptsUsedBeforeValidation < settings.maximumPinAttempts;
}
