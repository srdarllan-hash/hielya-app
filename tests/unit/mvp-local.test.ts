import { describe, expect, it } from 'vitest';
import {
  MVP_LOCAL_36_CATALOG,
  canCompleteDelivery,
  canReserveComposite,
  generateDeliveryPin,
  getCatalogCategoryCounts,
  isMvpCatalogValid,
  quoteSimulatedDelivery,
  remainingForMinimum,
} from '@hielya/ui';

const simulationSettings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

describe('MVP local rules', () => {
  it('keeps the exact 36-SKU selection and six ice-inclusive composites', () => {
    expect(isMvpCatalogValid()).toBe(true);
    expect(getCatalogCategoryCounts()).toEqual({
      Cervejas: 8,
      Refrigerantes: 6,
      Energéticos: 3,
      Águas: 2,
      Destilados: 5,
      'Vinhos e Espumantes': 3,
      Gelo: 2,
      Snacks: 4,
      Conveniência: 3,
    });
    expect(MVP_LOCAL_36_CATALOG.filter((item) => item.kind === 'composite')).toHaveLength(6);
  });

  it('quotes only deliveries within the configured four-kilometre road limit', () => {
    expect(quoteSimulatedDelivery(0, simulationSettings)).toEqual({ eligible: true, feeCents: 200 });
    expect(quoteSimulatedDelivery(2.5, simulationSettings)).toEqual({ eligible: true, feeCents: 350 });
    expect(quoteSimulatedDelivery(4, simulationSettings)).toEqual({ eligible: true, feeCents: 440 });
    expect(quoteSimulatedDelivery(4.01, simulationSettings)).toEqual({ eligible: false, feeCents: null });
  });

  it('uses product subtotal only for the €25 minimum', () => {
    expect(remainingForMinimum(2400, simulationSettings)).toBe(100);
    expect(remainingForMinimum(2500, simulationSettings)).toBe(0);
  });

  it('never creates independent inventory for a pack and enforces the PIN limit', () => {
    const pack = MVP_LOCAL_36_CATALOG.find((item) => item.sku === 'HYA-CMB-001');
    expect(pack && canReserveComposite(pack, { 'HYA-CER-001': 6, 'HYA-GEL-051': 1 })).toBe(true);
    expect(pack && canReserveComposite(pack, { 'HYA-CER-001': 6, 'HYA-GEL-051': 0 })).toBe(false);
    expect(generateDeliveryPin(() => 0.0001)).toBe('0001');
    expect(canCompleteDelivery(true, 2, simulationSettings)).toBe(true);
    expect(canCompleteDelivery(true, 3, simulationSettings)).toBe(false);
  });
});
