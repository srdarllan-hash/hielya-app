import { describe, expect, it } from 'vitest';
import {
  MVP_LOCAL_36_CATALOG,
  MVP_SIMULATION_DEFAULTS,
  canCompleteDelivery,
  canReserveComposite,
  generateDeliveryPin,
  getCatalogCategoryCounts,
  isMvpCatalogValid,
  quoteSimulatedDelivery,
  remainingForMinimum,
} from '@hielya/ui';

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
    expect(quoteSimulatedDelivery(0, MVP_SIMULATION_DEFAULTS)).toEqual({ eligible: true, feeCents: 200 });
    expect(quoteSimulatedDelivery(2.5, MVP_SIMULATION_DEFAULTS)).toEqual({ eligible: true, feeCents: 350 });
    expect(quoteSimulatedDelivery(4, MVP_SIMULATION_DEFAULTS)).toEqual({ eligible: true, feeCents: 440 });
    expect(quoteSimulatedDelivery(4.01, MVP_SIMULATION_DEFAULTS)).toEqual({ eligible: false, feeCents: null });
  });

  it('uses product subtotal only for the €25 minimum', () => {
    expect(remainingForMinimum(2400, MVP_SIMULATION_DEFAULTS)).toBe(100);
    expect(remainingForMinimum(2500, MVP_SIMULATION_DEFAULTS)).toBe(0);
  });

  it('never creates independent inventory for a pack and enforces the PIN limit', () => {
    const pack = MVP_LOCAL_36_CATALOG.find((item) => item.sku === 'HYA-CMB-001');
    expect(pack && canReserveComposite(pack, { 'HYA-CER-001': 6, 'HYA-GEL-051': 1 })).toBe(true);
    expect(pack && canReserveComposite(pack, { 'HYA-CER-001': 6, 'HYA-GEL-051': 0 })).toBe(false);
    expect(generateDeliveryPin(() => 0.0001)).toBe('0001');
    expect(canCompleteDelivery(true, 2, MVP_SIMULATION_DEFAULTS)).toBe(true);
    expect(canCompleteDelivery(true, 3, MVP_SIMULATION_DEFAULTS)).toBe(false);
  });
});
