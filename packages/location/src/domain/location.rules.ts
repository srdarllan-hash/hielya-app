import type { Address, LocationResult, ServiceAreaResult } from './location.types';

export function isAddressConfirmable(address: Address): boolean {
  return Boolean(
    address.formatted.trim()
    && address.locality.trim()
    && address.countryCode.length === 2
    && Number.isFinite(address.coordinates.latitude)
    && Number.isFinite(address.coordinates.longitude),
  );
}

export function canContinueWithLocation(location: LocationResult | null): location is LocationResult {
  return Boolean(
    location
    && location.confirmedByUser
    && location.confirmedAt
    && location.serviceArea?.serviceable
    && location.serviceArea.quoteId,
  );
}

export function isQuoteFresh(result: ServiceAreaResult, now = Date.now()): boolean {
  if (!result.expiresAt) return false;
  return now < Date.parse(result.expiresAt);
}

export function shouldRequestManualConfirmation(location: LocationResult, acceptableAccuracyMeters: number): boolean {
  return location.source !== 'saved'
    || location.coordinates.accuracyMeters === null
    || location.coordinates.accuracyMeters > acceptableAccuracyMeters
    || !location.confirmedByUser;
}
