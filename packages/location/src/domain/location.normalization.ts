import { LocationDomainError, createLocationError } from './location.errors';
import type { Address, Coordinates, ManualAddressInput } from './location.types';

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

export function normalizeCoordinates(input: Coordinates): Coordinates {
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
    throw new LocationDomainError(createLocationError('ADDRESS_INVALID', 'position', { causeCode: 'INVALID_LATITUDE' }));
  }
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    throw new LocationDomainError(createLocationError('ADDRESS_INVALID', 'position', { causeCode: 'INVALID_LONGITUDE' }));
  }
  return {
    ...input,
    accuracyMeters: input.accuracyMeters === null ? null : clamp(Math.max(0, input.accuracyMeters), 0, 100_000),
    capturedAt: input.capturedAt || new Date().toISOString(),
  };
}

export function normalizeManualAddressInput(input: ManualAddressInput): ManualAddressInput {
  const clean = (value?: string) => value?.trim().replace(/\s+/g, ' ') || undefined;
  return {
    query: clean(input.query) ?? '',
    street: clean(input.street),
    houseNumber: clean(input.houseNumber),
    unit: clean(input.unit),
    buildingName: clean(input.buildingName),
    floor: clean(input.floor),
    door: clean(input.door),
    postalCode: clean(input.postalCode)?.toUpperCase(),
    locality: clean(input.locality),
    kind: input.kind ?? 'unknown',
    meetingPoint: clean(input.meetingPoint),
    instructions: clean(input.instructions),
  };
}

export function normalizeAddress(input: Address): Address {
  const formatted = input.formatted.trim().replace(/\s+/g, ' ');
  const locality = input.locality.trim().replace(/\s+/g, ' ');
  const countryCode = input.countryCode.trim().toUpperCase();
  if (!formatted || !locality || countryCode.length !== 2) {
    throw new LocationDomainError(createLocationError('ADDRESS_INCOMPLETE', 'address_validation'));
  }
  return {
    ...input,
    formatted,
    locality,
    countryCode,
    postalCode: input.postalCode?.trim().toUpperCase() || null,
    coordinates: normalizeCoordinates(input.coordinates),
  };
}
