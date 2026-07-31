import { LocationDomainError, createLocationError } from '../domain/location.errors';
import type { ReverseGeocodingRequest, ReverseGeocodingService } from '../ports/location.ports';
import { fakeAddresses } from './fake-data';

export type FakeNetworkScenario = 'success' | 'network_error' | 'timeout';

export class FakeReverseGeocodingService implements ReverseGeocodingService {
  constructor(private readonly scenario: FakeNetworkScenario = 'success') {}

  async reverseGeocode(_request: ReverseGeocodingRequest) {
    if (this.scenario === 'network_error') {
      throw new LocationDomainError(createLocationError('NETWORK_ERROR', 'reverse_geocoding'));
    }
    if (this.scenario === 'timeout') {
      throw new LocationDomainError(createLocationError('POSITION_TIMEOUT', 'reverse_geocoding'));
    }
    return { ...fakeAddresses[0], coordinates: _request.coordinates };
  }
}
