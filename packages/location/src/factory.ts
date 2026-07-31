import { defaultLocationPolicies, type LocationPolicies } from './domain/location.policies';
import { createLocationError, normalizeLocationError } from './domain/location.errors';
import type { LocationEffect, LocationEvent } from './domain/location.events';
import type { LocationLocale, LocationOutcome } from './domain/location.types';
import type {
  AddressSearchService,
  AddressValidationService,
  GeolocationAdapter,
  LocationCompletionPort,
  LocationRepository,
  LocationStore,
  ReverseGeocodingService,
  ServiceAreaService,
} from './ports/location.ports';
import { BrowserGeolocationAdapter } from './adapters/BrowserGeolocationAdapter';
import { FakeGeolocationAdapter, type FakeGeolocationScenario } from './adapters/FakeGeolocationAdapter';
import { FakeReverseGeocodingService, type FakeNetworkScenario } from './adapters/FakeReverseGeocodingService';
import { FakeAddressSearchService } from './adapters/FakeAddressSearchService';
import { FakeAddressValidationService } from './adapters/FakeAddressValidationService';
import { FakeServiceAreaService, type FakeServiceAreaScenario } from './adapters/FakeServiceAreaService';
import { SessionLocationRepository } from './adapters/SessionLocationRepository';
import { EventLocationCompletionPort } from './adapters/EventLocationCompletionPort';
import { createLocationStore } from './adapters/createLocationStore';

export interface LocationDependencies {
  geolocation: GeolocationAdapter;
  reverseGeocoding: ReverseGeocodingService;
  addressSearch: AddressSearchService;
  addressValidation: AddressValidationService;
  serviceArea: ServiceAreaService;
  repository: LocationRepository;
  completion: LocationCompletionPort;
  policies: LocationPolicies;
  locale: LocationLocale;
}

export interface LocationFactoryOptions {
  locale?: LocationLocale;
  geolocationMode?: 'browser' | 'fake';
  geolocationScenario?: FakeGeolocationScenario;
  networkScenario?: FakeNetworkScenario;
  serviceAreaScenario?: FakeServiceAreaScenario;
  completion?: LocationCompletionPort;
  repository?: LocationRepository;
  policies?: Partial<LocationPolicies>;
}

export function createLocationDependencies(options: LocationFactoryOptions = {}): LocationDependencies {
  const policies: LocationPolicies = {
    ...defaultLocationPolicies,
    ...options.policies,
    retry: { ...defaultLocationPolicies.retry, ...options.policies?.retry },
    operation: { ...defaultLocationPolicies.operation, ...options.policies?.operation },
    retention: { ...defaultLocationPolicies.retention, ...options.policies?.retention },
    accuracy: { ...defaultLocationPolicies.accuracy, ...options.policies?.accuracy },
  };
  return {
    geolocation: options.geolocationMode === 'fake'
      ? new FakeGeolocationAdapter(options.geolocationScenario)
      : new BrowserGeolocationAdapter(),
    reverseGeocoding: new FakeReverseGeocodingService(options.networkScenario),
    addressSearch: new FakeAddressSearchService(options.networkScenario),
    addressValidation: new FakeAddressValidationService(),
    serviceArea: new FakeServiceAreaService(options.serviceAreaScenario),
    repository: options.repository ?? new SessionLocationRepository(policies.retention),
    completion: options.completion ?? new EventLocationCompletionPort(),
    policies,
    locale: options.locale ?? 'es',
  };
}

export interface LocationController {
  store: LocationStore;
  dispatch(event: LocationEvent): Promise<void>;
  cancel(): void;
}

export function createLocationController(
  dependencies: LocationDependencies,
  store: LocationStore = createLocationStore(),
): LocationController {
  const active = new Set<AbortController>();
  let disposed = false;

  const run = async (event: LocationEvent): Promise<void> => {
    if (disposed) return;
    const effects = store.dispatch(event);
    for (const effect of effects) await execute(effect);
  };

  const withAbort = async <T>(operation: () => Promise<T>) => {
    const controller = new AbortController();
    active.add(controller);
    try { return await operation(); }
    finally { active.delete(controller); }
  };

  const failureEvent = (effect: LocationEffect, error: unknown): LocationEvent => {
    const operation = effect.type === 'REQUEST_PERMISSION' ? 'permission'
      : effect.type === 'GET_CURRENT_POSITION' ? 'position'
        : effect.type === 'REVERSE_GEOCODE' ? 'reverse_geocoding'
          : effect.type === 'SEARCH_ADDRESS' ? 'address_search'
            : effect.type === 'RESOLVE_SUGGESTION' || effect.type === 'VALIDATE_MANUAL_ADDRESS' ? 'address_validation'
              : effect.type === 'CHECK_SERVICE_AREA' ? 'service_area'
                : effect.type === 'PERSIST_CONFIRMED_LOCATION' ? 'persistence'
                  : 'completion';
    const normalized = normalizeLocationError(error, operation, operation === 'position' ? 'POSITION_UNAVAILABLE' : 'NETWORK_ERROR');
    if (normalized.code === 'PERMISSION_DENIED') return { type: 'PERMISSION_DENIED', error: normalized };
    if (normalized.code === 'POSITION_TIMEOUT') return { type: 'OPERATION_TIMEOUT', operation, error: normalized };
    if (operation === 'position') return { type: 'POSITION_UNAVAILABLE', error: normalized };
    if (operation === 'address_search') return { type: 'ADDRESS_SEARCH_FAILED', error: normalized };
    return { type: 'ADDRESS_REJECTED', error: normalized };
  };

  const execute = async (effect: LocationEffect): Promise<void> => {
    try {
      switch (effect.type) {
        case 'REQUEST_PERMISSION': {
          const permission = await dependencies.geolocation.getPermissionStatus();
          await run(permission === 'denied'
            ? { type: 'PERMISSION_DENIED', error: createLocationError('PERMISSION_DENIED', 'permission', { recoverable: false }) }
            : { type: 'PERMISSION_GRANTED' });
          break;
        }
        case 'GET_CURRENT_POSITION': {
          const coordinates = await withAbort(() => dependencies.geolocation.getCurrentPosition({
            enableHighAccuracy: dependencies.policies.operation.enableHighAccuracy,
            timeoutMs: dependencies.policies.operation.geolocationTimeoutMs,
            maximumAgeMs: dependencies.policies.operation.maximumPositionAgeMs,
          }));
          await run({ type: 'POSITION_RECEIVED', coordinates });
          break;
        }
        case 'REVERSE_GEOCODE': {
          const address = await withAbort(() => dependencies.reverseGeocoding.reverseGeocode({
            coordinates: effect.coordinates,
            locale: dependencies.locale,
            countryCodes: ['ES'],
          }));
          await run({ type: 'ADDRESS_RESOLVED', address, source: 'device' });
          break;
        }
        case 'SEARCH_ADDRESS': {
          const suggestions = await withAbort(() => dependencies.addressSearch.search({
            query: effect.query,
            locale: dependencies.locale,
            countryCodes: ['ES'],
          }));
          await run({ type: 'ADDRESS_SEARCH_RESOLVED', suggestions });
          break;
        }
        case 'RESOLVE_SUGGESTION': {
          const address = await withAbort(() => dependencies.addressSearch.resolveSuggestion(effect.suggestion));
          await run({ type: 'ADDRESS_RESOLVED', address, source: 'manual' });
          break;
        }
        case 'VALIDATE_MANUAL_ADDRESS': {
          const address = await withAbort(() => dependencies.addressValidation.validateManualAddress(effect.input));
          await run({ type: 'ADDRESS_RESOLVED', address, source: 'manual' });
          break;
        }
        case 'CHECK_SERVICE_AREA': {
          const result = await withAbort(() => dependencies.serviceArea.validate(effect.location));
          await run(result.serviceable
            ? { type: 'SERVICE_AREA_ACCEPTED', result }
            : { type: 'SERVICE_AREA_REJECTED', result });
          break;
        }
        case 'PERSIST_CONFIRMED_LOCATION':
          await dependencies.repository.saveConfirmed(effect.location);
          break;
        case 'COMPLETE_LOCATION':
          await dependencies.completion.complete(effect.outcome);
          await run({ type: 'COMPLETION_EMITTED', outcome: effect.outcome });
          break;
      }
    } catch (error) {
      await run(failureEvent(effect, error));
    }
  };

  return {
    store,
    dispatch: run,
    cancel: () => {
      disposed = true;
      active.forEach((controller) => controller.abort());
      active.clear();
    },
  };
}

export class CapturingLocationCompletionPort implements LocationCompletionPort {
  readonly outcomes: LocationOutcome[] = [];
  complete(outcome: LocationOutcome) { this.outcomes.push(outcome); }
}
