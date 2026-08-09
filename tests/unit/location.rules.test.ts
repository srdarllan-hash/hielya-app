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
  type LocationResult,
} from '@hielya/location';

const validPrequote: LocationResult = {
  source: 'manual',
  coordinates: fakeAddresses[0].coordinates,
  address: fakeAddresses[0],
  confidence: 'exact',
  confirmedByUser: true,
  confirmedAt: '2026-08-09T12:00:00.000Z',
  deliveryQuoteId: null,
  serviceArea: {
    serviceable: true,
    reason: 'SERVICEABLE',
    distanceMeters: 2_500,
    distanceMethod: 'route',
    radiusMeters: null,
    storeId: null,
    deliveryFeeCents: 350,
    estimatedMinutes: null,
    quoteId: null,
    expiresAt: null,
  },
};

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

  it('allows a validated non-binding prequote with null quote identifiers', () => {
    expect(canContinueWithLocation(validPrequote)).toBe(true);
    expect(validPrequote.serviceArea?.quoteId).toBeNull();
    expect(validPrequote.deliveryQuoteId).toBeNull();
  });

  it('rejects missing or unconfirmed locations and invalid confirmation timestamps', () => {
    expect(canContinueWithLocation(null)).toBe(false);
    expect(canContinueWithLocation({ ...validPrequote, confirmedByUser: false })).toBe(false);
    expect(canContinueWithLocation({ ...validPrequote, confirmedAt: null })).toBe(false);
    expect(canContinueWithLocation({ ...validPrequote, confirmedAt: '' })).toBe(false);
    expect(canContinueWithLocation({ ...validPrequote, confirmedAt: 'not-a-date' })).toBe(false);
  });

  it('requires an explicitly serviceable route prequote', () => {
    expect(canContinueWithLocation({ ...validPrequote, serviceArea: null })).toBe(false);
    expect(canContinueWithLocation({
      ...validPrequote,
      serviceArea: { ...validPrequote.serviceArea!, serviceable: false },
    })).toBe(false);
    expect(canContinueWithLocation({
      ...validPrequote,
      serviceArea: { ...validPrequote.serviceArea!, reason: 'OUTSIDE_RADIUS' },
    })).toBe(false);
    expect(canContinueWithLocation({
      ...validPrequote,
      serviceArea: { ...validPrequote.serviceArea!, distanceMethod: 'straight_line' },
    })).toBe(false);
  });

  it('requires a finite non-negative server distance', () => {
    for (const distanceMeters of [null, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(canContinueWithLocation({
        ...validPrequote,
        serviceArea: { ...validPrequote.serviceArea!, distanceMeters },
      })).toBe(false);
    }
    expect(canContinueWithLocation({
      ...validPrequote,
      serviceArea: { ...validPrequote.serviceArea!, distanceMeters: 0 },
    })).toBe(true);
  });

  it('requires an integer non-negative server fee', () => {
    for (const deliveryFeeCents of [null, -1, 1.5]) {
      expect(canContinueWithLocation({
        ...validPrequote,
        serviceArea: { ...validPrequote.serviceArea!, deliveryFeeCents },
      })).toBe(false);
    }
    expect(canContinueWithLocation({
      ...validPrequote,
      serviceArea: { ...validPrequote.serviceArea!, deliveryFeeCents: 0 },
    })).toBe(true);
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
