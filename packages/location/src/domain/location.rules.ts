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
  if (!location || !location.confirmedByUser) return false;

  const confirmedAt = location.confirmedAt;
  const serviceArea = location.serviceArea;

  return Boolean(
    typeof confirmedAt === 'string'
    && confirmedAt.trim().length > 0
    && Number.isFinite(Date.parse(confirmedAt))
    && serviceArea
    && serviceArea.serviceable
    && serviceArea.reason === 'SERVICEABLE'
    && serviceArea.distanceMethod === 'route'
    && typeof serviceArea.distanceMeters === 'number'
    && Number.isFinite(serviceArea.distanceMeters)
    && serviceArea.distanceMeters >= 0
    && typeof serviceArea.deliveryFeeCents === 'number'
    && Number.isInteger(serviceArea.deliveryFeeCents)
    && serviceArea.deliveryFeeCents >= 0,
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
