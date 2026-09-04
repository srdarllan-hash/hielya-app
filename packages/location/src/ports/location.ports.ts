import type { LocationEffect, LocationEvent } from '../domain/location.events';
import type { LocationContext } from '../domain/location.machine';
import type {
  Address,
  AddressSuggestion,
  Coordinates,
  LocationLocale,
  LocationOutcome,
  LocationResult,
  ManualAddressInput,
  ServiceAreaResult,
} from '../domain/location.types';
import type {
  LocationAccuracyPolicy,
  LocationOperationPolicy,
  LocationRetentionPolicy,
  RetryPolicy,
} from '../domain/location.policies';

export interface GeolocationRequest {
  enableHighAccuracy: boolean;
  timeoutMs: number;
  maximumAgeMs: number;
  signal?: AbortSignal;
}

export interface GeolocationAdapter {
  getPermissionStatus(): Promise<'prompt' | 'granted' | 'denied' | 'unsupported' | 'unknown'>;
  getCurrentPosition(request: GeolocationRequest): Promise<Coordinates>;
}

export interface ReverseGeocodingRequest {
  coordinates: Coordinates;
  locale: LocationLocale;
  countryCodes?: string[];
  signal?: AbortSignal;
}

export interface ReverseGeocodingService {
  reverseGeocode(request: ReverseGeocodingRequest): Promise<Address>;
}

export interface AddressSearchRequest {
  query: string;
  locale: LocationLocale;
  countryCodes: string[];
  proximity?: Coordinates;
  sessionToken?: string;
  signal?: AbortSignal;
}

export interface AddressSearchService {
  search(request: AddressSearchRequest): Promise<AddressSuggestion[]>;
  resolveSuggestion(suggestion: AddressSuggestion, signal?: AbortSignal): Promise<Address>;
}

export interface AddressValidationService {
  validateManualAddress(input: ManualAddressInput, signal?: AbortSignal): Promise<Address>;
}

export interface ServiceAreaService {
  validate(location: LocationResult, signal?: AbortSignal): Promise<ServiceAreaResult>;
}

export interface LocationRepository {
  getCurrent(): Promise<LocationResult | null>;
  saveTransient(location: LocationResult): Promise<void>;
  saveConfirmed(location: LocationResult): Promise<void>;
  clearTransient(): Promise<void>;
  clearAll(): Promise<void>;
}

export interface LocationStore {
  getState(): LocationContext;
  dispatch(event: LocationEvent): LocationEffect[];
  subscribe(listener: (state: LocationContext) => void): () => void;
}

export interface LocationCompletionPort {
  complete(outcome: LocationOutcome): Promise<void> | void;
}

export interface LocationPolicyPorts {
  retry: RetryPolicy;
  operation: LocationOperationPolicy;
  retention: LocationRetentionPolicy;
  accuracy: LocationAccuracyPolicy;
}
