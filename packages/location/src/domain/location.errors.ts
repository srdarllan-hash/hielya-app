import type { LocationError, LocationErrorCode, LocationOperation } from './location.types';

export class LocationDomainError extends Error {
  readonly detail: LocationError;

  constructor(detail: LocationError) {
    super(detail.messageKey);
    this.name = 'LocationDomainError';
    this.detail = detail;
  }
}

export function createLocationError(
  code: LocationErrorCode,
  operation: LocationOperation,
  options: Partial<Omit<LocationError, 'code' | 'operation'>> = {},
): LocationError {
  return {
    code,
    operation,
    recoverable: options.recoverable ?? code !== 'PERMISSION_DENIED',
    messageKey: options.messageKey ?? `location.error.${code.toLowerCase()}`,
    field: options.field,
    causeCode: options.causeCode,
    retryAfterMs: options.retryAfterMs,
  };
}

export function normalizeLocationError(
  error: unknown,
  operation: LocationOperation,
  fallbackCode: LocationErrorCode = 'UNKNOWN',
): LocationError {
  if (error instanceof LocationDomainError) return error.detail;
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return createLocationError('ABORTED', operation, { recoverable: true });
  }
  return createLocationError(fallbackCode, operation, {
    recoverable: true,
    causeCode: error instanceof Error ? error.name : undefined,
  });
}
