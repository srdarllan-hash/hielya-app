import type { LocationError } from './location.types';

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs(attempt: number): number;
  retryable(error: LocationError): boolean;
}

export interface LocationOperationPolicy {
  geolocationTimeoutMs: number;
  geocodingTimeoutMs: number;
  addressSearchTimeoutMs: number;
  serviceAreaTimeoutMs: number;
  maximumPositionAgeMs: number;
  enableHighAccuracy: boolean;
}

export interface LocationRetentionPolicy {
  confirmedGuestTtlMs: number;
  quoteTtlMs: number;
}

export interface LocationAccuracyPolicy {
  acceptableAccuracyMeters: number;
  requireUserConfirmation: boolean;
}

export interface LocationPolicies {
  retry: RetryPolicy;
  operation: LocationOperationPolicy;
  retention: LocationRetentionPolicy;
  accuracy: LocationAccuracyPolicy;
  privacyCopy: string;
}

export const defaultLocationPolicies: LocationPolicies = {
  retry: {
    maxAttempts: 2,
    backoffMs: (attempt) => Math.min(attempt, 2) * 500,
    retryable: (error) => error.recoverable && error.code !== 'PERMISSION_DENIED',
  },
  operation: {
    geolocationTimeoutMs: 10_000,
    geocodingTimeoutMs: 8_000,
    addressSearchTimeoutMs: 8_000,
    serviceAreaTimeoutMs: 8_000,
    maximumPositionAgeMs: 60_000,
    enableHighAccuracy: false,
  },
  retention: {
    confirmedGuestTtlMs: 30 * 60 * 1_000,
    quoteTtlMs: 10 * 60 * 1_000,
  },
  accuracy: {
    acceptableAccuracyMeters: 150,
    requireUserConfirmation: true,
  },
  privacyCopy: 'Usaremos tu ubicación solo para comprobar la dirección y la cobertura. También puedes introducirla manualmente.',
};
