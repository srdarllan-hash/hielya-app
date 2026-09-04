import { createLocationError } from './location.errors';
import { normalizeManualAddressInput } from './location.normalization';
import { canContinueWithLocation, isAddressConfirmable } from './location.rules';
import type { LocationEffect, LocationEvent } from './location.events';
import type {
  AddressSuggestion,
  LocationError,
  LocationOperation,
  LocationPermissionStatus,
  LocationResult,
  LocationState,
  ManualAddressInput,
} from './location.types';

export interface LocationContext {
  state: LocationState;
  permission: LocationPermissionStatus;
  manualInput: ManualAddressInput;
  suggestions: AddressSuggestion[];
  candidate: LocationResult | null;
  confirmed: LocationResult | null;
  error: LocationError | null;
  online: boolean;
  retryCount: number;
  lastOperation: LocationOperation | null;
  lastRetryableEffect: LocationEffect | null;
  completionEmitted: boolean;
}

export interface LocationTransition {
  context: LocationContext;
  effects: LocationEffect[];
}

export const initialLocationContext: LocationContext = {
  state: 'idle',
  permission: 'unknown',
  manualInput: { query: '' },
  suggestions: [],
  candidate: null,
  confirmed: null,
  error: null,
  online: true,
  retryCount: 0,
  lastOperation: null,
  lastRetryableEffect: null,
  completionEmitted: false,
};

const operationForEffect = (effect: LocationEffect): LocationOperation => {
  switch (effect.type) {
    case 'REQUEST_PERMISSION': return 'permission';
    case 'GET_CURRENT_POSITION': return 'position';
    case 'REVERSE_GEOCODE': return 'reverse_geocoding';
    case 'SEARCH_ADDRESS': return 'address_search';
    case 'RESOLVE_SUGGESTION':
    case 'VALIDATE_MANUAL_ADDRESS': return 'address_validation';
    case 'CHECK_SERVICE_AREA': return 'service_area';
    case 'PERSIST_CONFIRMED_LOCATION': return 'persistence';
    case 'COMPLETE_LOCATION': return 'completion';
  }
};

const withEffect = (context: LocationContext, effect: LocationEffect, state: LocationState): LocationTransition => ({
  context: {
    ...context,
    state,
    error: null,
    lastOperation: operationForEffect(effect),
    lastRetryableEffect: effect,
  },
  effects: [effect],
});

const withError = (context: LocationContext, state: LocationState, error: LocationError): LocationTransition => ({
  context: { ...context, state, error },
  effects: [],
});

export function transitionLocation(context: LocationContext, event: LocationEvent): LocationTransition {
  switch (event.type) {
    case 'SCREEN_OPENED':
      return { context: { ...context, state: context.online ? 'idle' : 'offline' }, effects: [] };
    case 'USE_CURRENT_LOCATION':
      return withEffect(context, { type: 'REQUEST_PERMISSION' }, 'requesting_permission');
    case 'PERMISSION_GRANTED':
      return withEffect({ ...context, permission: 'granted' }, { type: 'GET_CURRENT_POSITION' }, 'locating');
    case 'PERMISSION_DENIED':
      return withError(
        { ...context, permission: 'denied' },
        'permission_denied',
        event.error ?? createLocationError('PERMISSION_DENIED', 'permission', { recoverable: false }),
      );
    case 'POSITION_RECEIVED':
      return withEffect(context, { type: 'REVERSE_GEOCODE', coordinates: event.coordinates }, 'reverse_geocoding');
    case 'POSITION_UNAVAILABLE':
      return withError(context, 'location_unavailable', event.error);
    case 'ENTER_MANUALLY':
      return { context: { ...context, state: 'manual_entry', error: null }, effects: [] };
    case 'ADDRESS_QUERY_CHANGED':
      return {
        context: {
          ...context,
          state: 'manual_entry',
          manualInput: normalizeManualAddressInput({ ...context.manualInput, query: event.query }),
          suggestions: event.query.trim() ? context.suggestions : [],
          error: null,
        },
        effects: [],
      };
    case 'SEARCH_ADDRESS': {
      const query = context.manualInput.query.trim();
      if (query.length < 3) {
        return withError(context, 'invalid_address', createLocationError('ADDRESS_INCOMPLETE', 'address_search', {
          field: 'query',
          recoverable: true,
        }));
      }
      return withEffect(context, { type: 'SEARCH_ADDRESS', query }, 'validating_manual_address');
    }
    case 'ADDRESS_SEARCH_RESOLVED':
      return {
        context: {
          ...context,
          state: event.suggestions.length ? 'manual_entry' : 'invalid_address',
          suggestions: event.suggestions,
          error: event.suggestions.length ? null : createLocationError('ADDRESS_INVALID', 'address_search'),
        },
        effects: [],
      };
    case 'ADDRESS_SEARCH_FAILED':
      return withError(context, event.error.code === 'NETWORK_OFFLINE' ? 'offline' : 'network_error', event.error);
    case 'SELECT_SUGGESTION':
      return withEffect(context, { type: 'RESOLVE_SUGGESTION', suggestion: event.suggestion }, 'validating_manual_address');
    case 'VALIDATE_MANUAL_ADDRESS':
      return withEffect(context, { type: 'VALIDATE_MANUAL_ADDRESS', input: normalizeManualAddressInput(event.input) }, 'validating_manual_address');
    case 'ADDRESS_RESOLVED': {
      if (!isAddressConfirmable(event.address)) {
        return withError(context, 'invalid_address', createLocationError('ADDRESS_INCOMPLETE', 'address_validation'));
      }
      const candidate: LocationResult = {
        source: event.source,
        coordinates: event.address.coordinates,
        address: event.address,
        confidence: event.source === 'device' ? 'approximate' : 'exact',
        confirmedByUser: false,
        confirmedAt: null,
        serviceArea: null,
        deliveryQuoteId: null,
      };
      return {
        context: { ...context, state: 'resolved', candidate, suggestions: [], error: null },
        effects: [],
      };
    }
    case 'ADDRESS_REJECTED': {
      const state = event.error.code === 'NETWORK_OFFLINE'
        ? 'offline'
        : event.error.operation === 'service_area'
          && (event.error.code === 'NETWORK_ERROR' || event.error.code === 'DELIVERY_QUOTE_REJECTED')
          ? 'network_error'
          : 'invalid_address';
      return withError(context, state, event.error);
    }
    case 'CONFIRM_ADDRESS': {
      if (!context.candidate) {
        return withError(context, 'invalid_address', createLocationError('ADDRESS_INVALID', 'address_validation'));
      }
      const location: LocationResult = {
        ...context.candidate,
        confirmedByUser: true,
        confirmedAt: new Date().toISOString(),
      };
      return withEffect({ ...context, candidate: location }, { type: 'CHECK_SERVICE_AREA', location }, 'checking_service_area');
    }
    case 'SERVICE_AREA_ACCEPTED': {
      if (!context.candidate) {
        return withError(context, 'invalid_address', createLocationError('ADDRESS_INVALID', 'service_area'));
      }
      const confirmed: LocationResult = {
        ...context.candidate,
        serviceArea: event.result,
        deliveryQuoteId: event.result.quoteId,
      };
      return {
        context: {
          ...context,
          state: 'success',
          candidate: confirmed,
          confirmed,
          error: null,
          lastOperation: 'persistence',
          lastRetryableEffect: null,
        },
        effects: [{ type: 'PERSIST_CONFIRMED_LOCATION', location: confirmed }],
      };
    }
    case 'SERVICE_AREA_REJECTED':
      return withError(
        { ...context, candidate: context.candidate ? { ...context.candidate, serviceArea: event.result } : null },
        'out_of_area',
        event.error ?? createLocationError(
          event.result.reason === 'PUBLIC_SPACE_NOT_ALLOWED' ? 'PUBLIC_SPACE_NOT_ALLOWED' : 'OUT_OF_SERVICE_AREA',
          'service_area',
        ),
      );
    case 'NETWORK_OFFLINE':
      return withError(context, 'offline', createLocationError('NETWORK_OFFLINE', context.lastOperation ?? 'address_search'));
    case 'NETWORK_ONLINE':
      return { context: { ...context, online: true, state: context.candidate ? 'resolved' : 'idle', error: null }, effects: [] };
    case 'OPERATION_TIMEOUT':
      return withError(context, 'timeout', event.error);
    case 'RETRY':
      if (!context.lastRetryableEffect) return { context: { ...context, state: 'idle', error: null }, effects: [] };
      return {
        context: { ...context, state: 'retrying', error: null, retryCount: context.retryCount + 1 },
        effects: [context.lastRetryableEffect],
      };
    case 'EDIT_ADDRESS':
      return { context: { ...context, state: 'manual_entry', error: null, suggestions: [] }, effects: [] };
    case 'CONTINUE':
      if (!canContinueWithLocation(context.confirmed)) return { context, effects: [] };
      return {
        context,
        effects: [{ type: 'COMPLETE_LOCATION', outcome: { type: 'LOCATION_CONFIRMED', location: context.confirmed } }],
      };
    case 'COMPLETION_EMITTED':
      return { context: { ...context, completionEmitted: true }, effects: [] };
    case 'RESET':
      return { context: { ...initialLocationContext, online: context.online }, effects: [] };
  }
}
