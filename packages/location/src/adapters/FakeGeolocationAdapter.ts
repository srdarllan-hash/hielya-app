import { LocationDomainError, createLocationError } from '../domain/location.errors';
import type { Coordinates } from '../domain/location.types';
import type { GeolocationAdapter, GeolocationRequest } from '../ports/location.ports';

export type FakeGeolocationScenario = 'granted' | 'denied' | 'unavailable' | 'timeout';

export class FakeGeolocationAdapter implements GeolocationAdapter {
  constructor(
    private readonly scenario: FakeGeolocationScenario = 'granted',
    private readonly coordinates: Coordinates = {
      latitude: 36.5384,
      longitude: -4.6239,
      accuracyMeters: 42,
      capturedAt: '2026-07-31T00:00:00.000Z',
      source: 'device',
    },
  ) {}

  async getPermissionStatus() {
    return this.scenario === 'denied' ? 'denied' as const : 'granted' as const;
  }

  async getCurrentPosition(_request: GeolocationRequest): Promise<Coordinates> {
    if (this.scenario === 'unavailable') {
      throw new LocationDomainError(createLocationError('POSITION_UNAVAILABLE', 'position'));
    }
    if (this.scenario === 'timeout') {
      throw new LocationDomainError(createLocationError('POSITION_TIMEOUT', 'position'));
    }
    if (this.scenario === 'denied') {
      throw new LocationDomainError(createLocationError('PERMISSION_DENIED', 'position', { recoverable: false }));
    }
    return this.coordinates;
  }
}
