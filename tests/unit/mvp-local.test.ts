import { describe, expect, it } from 'vitest';
import {
  canCompleteDelivery,
  generateDeliveryPin,
  getCatalogCategoryCounts,
  hasCompositeAvailability,
  isMvpCatalogValid,
  quoteSimulatedDelivery,
  remainingForMinimum,
} from '@hielya/ui';
import { MVP_LOCAL_36_CONTRACT_FIXTURE } from '../../packages/ui/src/domain/mvp-local.contract-fixture';

const simulationSettings = { minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: true };
const composite = (sku: string) => MVP_LOCAL_36_CONTRACT_FIXTURE.find((item) => item.sku === sku)!;

describe('MVP local contractual policy', () => {
  it('keeps the exact 30 original and six new composite SKUs', () => {
    const expectedSkus = ['HYA-CER-001','HYA-CER-003','HYA-CER-006','HYA-CER-009','HYA-CMB-001','HYA-CMB-002','HYA-CMB-003','HYA-CMB-004','HYA-REF-016','HYA-REF-017','HYA-REF-018','HYA-REF-019','HYA-REF-020','HYA-REF-023','HYA-ENE-026','HYA-ENE-027','HYA-ENE-029','HYA-AGU-032','HYA-AGU-034','HYA-DES-036','HYA-DES-040','HYA-DES-044','HYA-CMB-005','HYA-CMB-006','HYA-VIN-046','HYA-VIN-047','HYA-VIN-049','HYA-GEL-051','HYA-GEL-052','HYA-SNA-053','HYA-SNA-054','HYA-SNA-055','HYA-SNA-056','HYA-CON-058','HYA-CON-059','HYA-CON-060'];
    expect(MVP_LOCAL_36_CONTRACT_FIXTURE.map((item) => item.sku)).toEqual(expectedSkus);
    expect(isMvpCatalogValid(MVP_LOCAL_36_CONTRACT_FIXTURE)).toBe(true);
    expect(MVP_LOCAL_36_CONTRACT_FIXTURE.filter((item) => item.kind === 'unit')).toHaveLength(30);
    expect(MVP_LOCAL_36_CONTRACT_FIXTURE.filter((item) => item.kind === 'composite')).toHaveLength(6);
    expect(getCatalogCategoryCounts(MVP_LOCAL_36_CONTRACT_FIXTURE)).toEqual({ Cervejas: 8, Refrigerantes: 6, Energéticos: 3, Águas: 2, Destilados: 5, 'Vinhos e Espumantes': 3, Gelo: 2, Snacks: 4, Conveniência: 3 });
  });

  it('preserves every approved composite composition and real component reference', () => {
    expect(composite('HYA-CMB-001').componentQuantities).toEqual({ 'HYA-CER-001': 6, 'HYA-GEL-051': 1 });
    expect(composite('HYA-CMB-002').componentQuantities).toEqual({ 'HYA-CER-003': 6, 'HYA-GEL-051': 1 });
    expect(composite('HYA-CMB-003').componentQuantities).toEqual({ 'HYA-CER-006': 6, 'HYA-GEL-051': 1 });
    expect(composite('HYA-CMB-004').componentQuantities).toEqual({ 'HYA-CER-009': 6, 'HYA-GEL-051': 1 });
    expect(composite('HYA-CMB-005').componentQuantities).toEqual({ 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 });
    expect(composite('HYA-CMB-006').componentQuantities).toEqual({ 'HYA-DES-040': 1, 'HYA-ENE-026': 4, 'HYA-GEL-051': 1, 'HYA-CON-059': 1 });
    const unitSkus = new Set(MVP_LOCAL_36_CONTRACT_FIXTURE.filter((item) => item.kind === 'unit').map((item) => item.sku));
    for (const item of MVP_LOCAL_36_CONTRACT_FIXTURE.filter((candidate) => candidate.kind === 'composite')) {
      expect(Object.keys(item.componentQuantities!)).toEqual(expect.arrayContaining([expect.stringMatching(/^HYA-GEL-/)]));
      Object.keys(item.componentQuantities!).forEach((sku) => expect(unitSkus.has(sku)).toBe(true));
    }
  });

  it('blocks a composite when any component is absent or insufficient', () => {
    const pack = composite('HYA-CMB-005');
    expect(hasCompositeAvailability(pack, { 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 })).toBe(true);
    expect(hasCompositeAvailability(pack, { 'HYA-DES-036': 1, 'HYA-REF-023': 5, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 })).toBe(false);
    expect(hasCompositeAvailability(pack, { 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1 })).toBe(false);
  });

  it('uses only products for the minimum and applies the simulated delivery formula', () => {
    expect(remainingForMinimum(2400, simulationSettings)).toBe(100);
    expect(remainingForMinimum(2500, simulationSettings)).toBe(0);
    expect([0, 1, 2, 2.5, 3, 4].map((km) => quoteSimulatedDelivery(km, simulationSettings).feeCents)).toEqual([200, 260, 320, 350, 380, 440]);
    expect(quoteSimulatedDelivery(4.01, simulationSettings)).toEqual({ eligible: false, feeCents: null });
  });

  it('creates four digits and blocks delivery after the configured attempt limit', () => {
    expect(generateDeliveryPin(() => 0.0001)).toBe('0001');
    expect(generateDeliveryPin(() => 0.99999)).toBe('9999');
    expect(canCompleteDelivery(true, 2, simulationSettings)).toBe(true);
    expect(canCompleteDelivery(true, 3, simulationSettings)).toBe(false);
  });
});
