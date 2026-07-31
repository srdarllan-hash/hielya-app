import { describe, expect, it } from 'vitest';
import {
  canContinueWithLocation,
  fakeAddresses,
  isAddressConfirmable,
  isQuoteFresh,
  normalizeAddress,
  normalizeCoordinates,
  normalizeManualAddressInput,
  shouldRequestManualConfirmation,
} from '@hielya/location';

describe('C-002 pure location rules', () => {
  it('normalizes whitespace and postcode', () => {
    expect(normalizeManualAddressInput({ query: '  Paseo   Marítimo ', postalCode: ' 29640 ' })).toEqual(expect.objectContaining({
      query: 'Paseo Marítimo', postalCode: '29640', kind: 'unknown',
    }));
  });

  it('rejects invalid latitude', () => {
    expect(() => normalizeCoordinates({ ...fakeAddresses[0].coordinates, latitude: 91 })).toThrow();
  });

  it('normalizes a complete address', () => {
    const result = normalizeAddress({ ...fakeAddresses[0], formatted: `  ${fakeAddresses[0].formatted}  ` });
    expect(result.formatted).toBe(fakeAddresses[0].formatted);
  });

  it('requires a confirmable address', () => {
    expect(isAddressConfirmable(fakeAddresses[0])).toBe(true);
    expect(isAddressConfirmable({ ...fakeAddresses[0], locality: '' })).toBe(false);
  });

  it('requires confirmed serviceable quote before continue', () => {
    const base = {
      source: 'manual' as const, coordinates: fakeAddresses[0].coordinates, address: fakeAddresses[0], confidence: 'exact' as const,
      confirmedByUser: true, confirmedAt: new Date().toISOString(), deliveryQuoteId: 'quote',
      serviceArea: {
        serviceable: true, reason: 'SERVICEABLE' as const, distanceMeters: 2500, distanceMethod: 'route' as const, radiusMeters: 4000,
        storeId: 'store', deliveryFeeCents: 449, estimatedMinutes: 35, quoteId: 'quote', expiresAt: new Date(Date.now() + 1000).toISOString(),
      },
    };
    expect(canContinueWithLocation(base)).toBe(true);
    expect(canContinueWithLocation({ ...base, confirmedByUser: false })).toBe(false);
  });

  it('checks server-controlled quote freshness', () => {
    const result = {
      serviceable: true, reason: 'SERVICEABLE' as const, distanceMeters: 2500, distanceMethod: 'route' as const, radiusMeters: 4000,
      storeId: 'store', deliveryFeeCents: 449, estimatedMinutes: 35, quoteId: 'quote', expiresAt: new Date(Date.now() + 5000).toISOString(),
    };
    expect(isQuoteFresh(result)).toBe(true);
    expect(isQuoteFresh({ ...result, expiresAt: new Date(Date.now() - 1).toISOString() })).toBe(false);
  });

  it('keeps device locations subject to confirmation', () => {
    const result = {
      source: 'device' as const, coordinates: fakeAddresses[0].coordinates, address: fakeAddresses[0], confidence: 'approximate' as const,
      confirmedByUser: false, confirmedAt: null, serviceArea: null, deliveryQuoteId: null,
    };
    expect(shouldRequestManualConfirmation(result, 150)).toBe(true);
  });
});
