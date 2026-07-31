'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  createLocationController,
  createLocationDependencies,
  createLocationStore,
  fakeAddresses,
  createLocationError,
  type LocationContext,
  type LocationDependencies,
  type LocationEvent,
  type LocationFactoryOptions,
  type LocationResult,
  type LocationState,
} from '@hielya/location';
import type { LocationDemoVariant } from './location.types';

const serviceArea = {
  serviceable: true,
  reason: 'SERVICEABLE' as const,
  distanceMeters: 2500,
  distanceMethod: 'route' as const,
  radiusMeters: 4000,
  storeId: 'store-fuengirola-01',
  deliveryFeeCents: 449,
  estimatedMinutes: 35,
  quoteId: 'quote-demo-001',
  expiresAt: '2026-07-31T12:00:00.000Z',
};

function demoAddress(variant: LocationDemoVariant) {
  const base = variant === 'hotel' ? fakeAddresses[1] : variant === 'condominium' ? fakeAddresses[2] : fakeAddresses[0];
  if (variant !== 'long_address') return base;
  return {
    ...base,
    formatted: 'Residencial Mirador del Mediterráneo, Avenida Nuestra Señora del Carmen, Bloque 7, Portal C, 29640 Fuengirola, Málaga',
  };
}

export function createLocationDemoSeed(state: LocationState, variant: LocationDemoVariant = 'default'): Partial<LocationContext> {
  const address = demoAddress(variant);
  const candidate: LocationResult = {
    source: 'manual', coordinates: address.coordinates, address, confidence: 'exact', confirmedByUser: false,
    confirmedAt: null, serviceArea: null, deliveryQuoteId: null,
  };
  const confirmed: LocationResult = {
    ...candidate, confirmedByUser: true, confirmedAt: '2026-07-31T00:00:00.000Z', serviceArea, deliveryQuoteId: serviceArea.quoteId,
  };
  const errors: Partial<Record<LocationState, ReturnType<typeof createLocationError>>> = {
    permission_denied: createLocationError('PERMISSION_DENIED', 'permission', { recoverable: false }),
    location_unavailable: createLocationError('POSITION_UNAVAILABLE', 'position'),
    timeout: createLocationError('POSITION_TIMEOUT', 'position'),
    offline: createLocationError('NETWORK_OFFLINE', 'address_search'),
    network_error: createLocationError('NETWORK_ERROR', 'address_validation'),
    invalid_address: createLocationError('ADDRESS_INVALID', 'address_validation', { field: 'query' }),
    out_of_area: createLocationError('OUT_OF_SERVICE_AREA', 'service_area'),
  };
  return {
    state,
    candidate: state === 'resolved' || state === 'checking_service_area' ? candidate : state === 'success' || state === 'out_of_area' ? confirmed : null,
    confirmed: state === 'success' ? confirmed : null,
    error: errors[state] ?? null,
    online: state !== 'offline',
    manualInput: { query: state === 'manual_entry' || state === 'validating_manual_address' ? 'Paseo Marítimo' : '' },
  };
}

export interface UseLocationControllerOptions extends LocationFactoryOptions {
  dependencies?: LocationDependencies;
  initialState?: LocationState;
  demoVariant?: LocationDemoVariant;
}

export function useLocationController(options: UseLocationControllerOptions) {
  const [runtime] = useState(() => {
    const dependencies = options.dependencies ?? createLocationDependencies(options);
    const store = createLocationStore(createLocationDemoSeed(options.initialState ?? 'idle', options.demoVariant));
    return { dependencies, controller: createLocationController(dependencies, store) };
  });
  const snapshot = useSyncExternalStore(runtime.controller.store.subscribe, runtime.controller.store.getState, runtime.controller.store.getState);
  const dispatch = useCallback((event: LocationEvent) => runtime.controller.dispatch(event), [runtime]);

  useEffect(() => {
    const online = () => { void dispatch({ type: 'NETWORK_ONLINE' }); };
    const offline = () => { void dispatch({ type: 'NETWORK_OFFLINE' }); };
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      runtime.controller.cancel();
    };
  }, [dispatch, runtime]);

  return { context: snapshot, dispatch, dependencies: runtime.dependencies };
}
