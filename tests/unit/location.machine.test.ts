import { describe, expect, it } from 'vitest';
import {
  createLocationError,
  fakeAddresses,
  initialLocationContext,
  transitionLocation,
  type LocationContext,
} from '@hielya/location';

const reduce = (context: LocationContext, event: Parameters<typeof transitionLocation>[1]) => transitionLocation(context, event);

describe('C-002 location state machine', () => {
  it('starts device location only after explicit user action', () => {
    const result = reduce(initialLocationContext, { type: 'USE_CURRENT_LOCATION' });
    expect(result.context.state).toBe('requesting_permission');
    expect(result.effects).toEqual([{ type: 'REQUEST_PERMISSION' }]);
  });

  it('moves from granted permission to locating', () => {
    const result = reduce(initialLocationContext, { type: 'PERMISSION_GRANTED' });
    expect(result.context.state).toBe('locating');
    expect(result.effects[0]?.type).toBe('GET_CURRENT_POSITION');
  });

  it('moves position to reverse geocoding', () => {
    const coordinates = fakeAddresses[0].coordinates;
    const result = reduce(initialLocationContext, { type: 'POSITION_RECEIVED', coordinates });
    expect(result.context.state).toBe('reverse_geocoding');
    expect(result.effects).toEqual([{ type: 'REVERSE_GEOCODE', coordinates }]);
  });

  it('keeps permission denial recoverable through manual entry', () => {
    const denied = reduce(initialLocationContext, { type: 'PERMISSION_DENIED' });
    expect(denied.context.state).toBe('permission_denied');
    const manual = reduce(denied.context, { type: 'ENTER_MANUALLY' });
    expect(manual.context.state).toBe('manual_entry');
  });

  it('rejects a manual search shorter than three characters', () => {
    const context = { ...initialLocationContext, state: 'manual_entry' as const, manualInput: { query: 'ab' } };
    const result = reduce(context, { type: 'SEARCH_ADDRESS' });
    expect(result.context.state).toBe('invalid_address');
    expect(result.context.error?.field).toBe('query');
  });

  it('searches a normalized manual query', () => {
    const changed = reduce(initialLocationContext, { type: 'ADDRESS_QUERY_CHANGED', query: '  Paseo   Marítimo ' });
    const result = reduce(changed.context, { type: 'SEARCH_ADDRESS' });
    expect(result.context.state).toBe('validating_manual_address');
    expect(result.effects).toEqual([{ type: 'SEARCH_ADDRESS', query: 'Paseo Marítimo' }]);
  });

  it('stores resolved address as unconfirmed candidate', () => {
    const result = reduce(initialLocationContext, { type: 'ADDRESS_RESOLVED', address: fakeAddresses[0], source: 'manual' });
    expect(result.context.state).toBe('resolved');
    expect(result.context.candidate?.confirmedByUser).toBe(false);
  });

  it('does not check service area without a candidate', () => {
    const result = reduce(initialLocationContext, { type: 'CONFIRM_ADDRESS' });
    expect(result.context.state).toBe('invalid_address');
    expect(result.effects).toEqual([]);
  });

  it('checks service area after explicit address confirmation', () => {
    const resolved = reduce(initialLocationContext, { type: 'ADDRESS_RESOLVED', address: fakeAddresses[0], source: 'manual' });
    const confirmed = reduce(resolved.context, { type: 'CONFIRM_ADDRESS' });
    expect(confirmed.context.state).toBe('checking_service_area');
    expect(confirmed.effects[0]?.type).toBe('CHECK_SERVICE_AREA');
    expect(confirmed.context.candidate?.confirmedByUser).toBe(true);
  });

  it('persists only after service-area acceptance', () => {
    const resolved = reduce(initialLocationContext, { type: 'ADDRESS_RESOLVED', address: fakeAddresses[0], source: 'manual' });
    const checking = reduce(resolved.context, { type: 'CONFIRM_ADDRESS' });
    const result = reduce(checking.context, {
      type: 'SERVICE_AREA_ACCEPTED',
      result: {
        serviceable: true, reason: 'SERVICEABLE', distanceMeters: 2500, distanceMethod: 'route', radiusMeters: 4000,
        storeId: 'store', deliveryFeeCents: 449, estimatedMinutes: 35, quoteId: 'quote', expiresAt: new Date(Date.now() + 1000).toISOString(),
      },
    });
    expect(result.context.state).toBe('success');
    expect(result.context.confirmed?.serviceArea?.serviceable).toBe(true);
    expect(result.effects[0]?.type).toBe('PERSIST_CONFIRMED_LOCATION');
  });

  it('does not emit completion until Continue', () => {
    const confirmed = {
      source: 'manual' as const,
      coordinates: fakeAddresses[0].coordinates,
      address: fakeAddresses[0],
      confidence: 'exact' as const,
      confirmedByUser: true,
      confirmedAt: new Date().toISOString(),
      serviceArea: {
        serviceable: true, reason: 'SERVICEABLE' as const, distanceMeters: 2500, distanceMethod: 'route' as const, radiusMeters: 4000,
        storeId: 'store', deliveryFeeCents: 449, estimatedMinutes: 35, quoteId: 'quote', expiresAt: new Date(Date.now() + 1000).toISOString(),
      },
      deliveryQuoteId: 'quote',
    };
    const result = reduce({ ...initialLocationContext, state: 'success', confirmed }, { type: 'CONTINUE' });
    expect(result.effects).toEqual([{ type: 'COMPLETE_LOCATION', outcome: { type: 'LOCATION_CONFIRMED', location: confirmed } }]);
  });

  it('maps rejected coverage to out_of_area', () => {
    const result = reduce(initialLocationContext, {
      type: 'SERVICE_AREA_REJECTED',
      result: {
        serviceable: false, reason: 'OUTSIDE_RADIUS', distanceMeters: 10000, distanceMethod: 'route', radiusMeters: 4000,
        storeId: 'store', deliveryFeeCents: null, estimatedMinutes: null, quoteId: null, expiresAt: null,
      },
    });
    expect(result.context.state).toBe('out_of_area');
  });

  it('preserves retry effect after a network error', () => {
    const searching = reduce({ ...initialLocationContext, manualInput: { query: 'Paseo' } }, { type: 'SEARCH_ADDRESS' });
    const failed = reduce(searching.context, { type: 'ADDRESS_SEARCH_FAILED', error: createLocationError('NETWORK_ERROR', 'address_search') });
    const retry = reduce(failed.context, { type: 'RETRY' });
    expect(retry.context.state).toBe('retrying');
    expect(retry.effects[0]).toEqual({ type: 'SEARCH_ADDRESS', query: 'Paseo' });
  });

  it('never encodes a C-003 or C-005 navigation target', () => {
    const source = transitionLocation.toString();
    expect(source).not.toContain('C-003');
    expect(source).not.toContain('C-005');
  });
});
