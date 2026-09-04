import type { LocationState } from '@hielya/location';

export type LocationDemoVariant = 'default' | 'long_address' | 'hotel' | 'condominium';
export type LocationDriver = 'browser' | 'fake';
export type LocationScenario =
  | 'serviceable'
  | 'out_of_area'
  | 'network_error'
  | 'timeout'
  | 'permission_denied'
  | 'location_unavailable';

const states = new Set<LocationState>([
  'idle',
  'requesting_permission',
  'locating',
  'reverse_geocoding',
  'manual_entry',
  'validating_manual_address',
  'resolved',
  'checking_service_area',
  'permission_denied',
  'location_unavailable',
  'timeout',
  'offline',
  'network_error',
  'invalid_address',
  'out_of_area',
  'retrying',
  'success',
]);

export function coerceLocationState(value?: string): LocationState {
  return states.has(value as LocationState) ? value as LocationState : 'idle';
}

export function coerceLocationDriver(value?: string): LocationDriver {
  return value === 'browser' ? 'browser' : 'fake';
}

export function coerceLocationScenario(value?: string): LocationScenario {
  const allowed = new Set<LocationScenario>(['serviceable','out_of_area','network_error','timeout','permission_denied','location_unavailable']);
  return allowed.has(value as LocationScenario) ? value as LocationScenario : 'serviceable';
}

export function coerceLocationDemoVariant(value?: string): LocationDemoVariant {
  return value === 'long_address' || value === 'hotel' || value === 'condominium' ? value : 'default';
}
