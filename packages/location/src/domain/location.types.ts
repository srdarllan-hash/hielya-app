export type LocationLocale = 'es' | 'en' | 'pt';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  source: 'device' | 'address_search' | 'saved_address';
}

export type AddressKind =
  | 'residential'
  | 'hotel'
  | 'condominium'
  | 'business'
  | 'public_space'
  | 'unknown';

export interface Address {
  id?: string;
  formatted: string;
  street: string | null;
  houseNumber: string | null;
  unit: string | null;
  buildingName: string | null;
  floor: string | null;
  door: string | null;
  postalCode: string | null;
  locality: string;
  municipality: string | null;
  province: string | null;
  countryCode: string;
  kind: AddressKind;
  meetingPoint: string | null;
  instructions: string | null;
  coordinates: Coordinates;
  providerReference?: string;
}

export interface AddressSuggestion {
  id: string;
  label: string;
  secondaryLabel?: string;
  kind: AddressKind;
  providerReference: string;
}

export type DistanceMethod = 'route' | 'straight_line' | 'unknown';

export type ServiceAreaReason =
  | 'SERVICEABLE'
  | 'OUTSIDE_RADIUS'
  | 'ROUTE_UNAVAILABLE'
  | 'PUBLIC_SPACE_NOT_ALLOWED'
  | 'STORE_PAUSED'
  | 'STORE_CLOSED'
  | 'INVALID_DESTINATION'
  | 'UNKNOWN';

export interface ServiceAreaResult {
  serviceable: boolean;
  reason: ServiceAreaReason;
  distanceMeters: number | null;
  distanceMethod: DistanceMethod;
  radiusMeters: number | null;
  storeId: string | null;
  deliveryFeeCents: number | null;
  estimatedMinutes: number | null;
  quoteId: string | null;
  expiresAt: string | null;
}

export interface LocationResult {
  source: 'device' | 'manual' | 'saved';
  coordinates: Coordinates;
  address: Address;
  confidence: 'exact' | 'interpolated' | 'approximate' | 'unknown';
  confirmedByUser: boolean;
  confirmedAt: string | null;
  serviceArea: ServiceAreaResult | null;
  deliveryQuoteId: string | null;
}

export type LocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'POSITION_TIMEOUT'
  | 'REVERSE_GEOCODING_FAILED'
  | 'ADDRESS_SEARCH_FAILED'
  | 'ADDRESS_INVALID'
  | 'ADDRESS_AMBIGUOUS'
  | 'ADDRESS_INCOMPLETE'
  | 'PUBLIC_SPACE_NOT_ALLOWED'
  | 'OUT_OF_SERVICE_AREA'
  | 'DELIVERY_QUOTE_REJECTED'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_ERROR'
  | 'ABORTED'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export type LocationOperation =
  | 'permission'
  | 'position'
  | 'reverse_geocoding'
  | 'address_search'
  | 'address_validation'
  | 'service_area'
  | 'persistence'
  | 'completion';

export interface LocationError {
  code: LocationErrorCode;
  operation: LocationOperation;
  recoverable: boolean;
  messageKey: string;
  field?: keyof ManualAddressInput;
  causeCode?: string;
  retryAfterMs?: number;
}

export type LocationPermissionStatus =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'unknown';

export type LocationState =
  | 'idle'
  | 'requesting_permission'
  | 'locating'
  | 'reverse_geocoding'
  | 'manual_entry'
  | 'validating_manual_address'
  | 'resolved'
  | 'checking_service_area'
  | 'permission_denied'
  | 'location_unavailable'
  | 'timeout'
  | 'offline'
  | 'network_error'
  | 'invalid_address'
  | 'out_of_area'
  | 'retrying'
  | 'success';

export interface ManualAddressInput {
  query: string;
  street?: string;
  houseNumber?: string;
  unit?: string;
  buildingName?: string;
  floor?: string;
  door?: string;
  postalCode?: string;
  locality?: string;
  kind?: AddressKind;
  meetingPoint?: string;
  instructions?: string;
}

export type LocationOutcome =
  | { type: 'LOCATION_CONFIRMED'; location: LocationResult }
  | { type: 'LOCATION_CANCELLED' };
