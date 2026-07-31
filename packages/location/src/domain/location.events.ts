import type {
  Address,
  AddressSuggestion,
  Coordinates,
  LocationError,
  LocationOperation,
  LocationOutcome,
  LocationResult,
  ManualAddressInput,
  ServiceAreaResult,
} from './location.types';

export type LocationEvent =
  | { type: 'SCREEN_OPENED' }
  | { type: 'USE_CURRENT_LOCATION' }
  | { type: 'ENTER_MANUALLY' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED'; error?: LocationError }
  | { type: 'POSITION_RECEIVED'; coordinates: Coordinates }
  | { type: 'POSITION_UNAVAILABLE'; error: LocationError }
  | { type: 'ADDRESS_QUERY_CHANGED'; query: string }
  | { type: 'SEARCH_ADDRESS' }
  | { type: 'ADDRESS_SEARCH_RESOLVED'; suggestions: AddressSuggestion[] }
  | { type: 'ADDRESS_SEARCH_FAILED'; error: LocationError }
  | { type: 'SELECT_SUGGESTION'; suggestion: AddressSuggestion }
  | { type: 'VALIDATE_MANUAL_ADDRESS'; input: ManualAddressInput }
  | { type: 'ADDRESS_RESOLVED'; address: Address; source: 'device' | 'manual' }
  | { type: 'ADDRESS_REJECTED'; error: LocationError }
  | { type: 'CONFIRM_ADDRESS' }
  | { type: 'SERVICE_AREA_ACCEPTED'; result: ServiceAreaResult }
  | { type: 'SERVICE_AREA_REJECTED'; result: ServiceAreaResult; error?: LocationError }
  | { type: 'NETWORK_OFFLINE' }
  | { type: 'NETWORK_ONLINE' }
  | { type: 'OPERATION_TIMEOUT'; operation: LocationOperation; error: LocationError }
  | { type: 'RETRY' }
  | { type: 'EDIT_ADDRESS' }
  | { type: 'CONTINUE' }
  | { type: 'COMPLETION_EMITTED'; outcome: LocationOutcome }
  | { type: 'RESET' };

export type LocationEffect =
  | { type: 'REQUEST_PERMISSION' }
  | { type: 'GET_CURRENT_POSITION' }
  | { type: 'REVERSE_GEOCODE'; coordinates: Coordinates }
  | { type: 'SEARCH_ADDRESS'; query: string }
  | { type: 'RESOLVE_SUGGESTION'; suggestion: AddressSuggestion }
  | { type: 'VALIDATE_MANUAL_ADDRESS'; input: ManualAddressInput }
  | { type: 'CHECK_SERVICE_AREA'; location: LocationResult }
  | { type: 'PERSIST_CONFIRMED_LOCATION'; location: LocationResult }
  | { type: 'COMPLETE_LOCATION'; outcome: LocationOutcome };
