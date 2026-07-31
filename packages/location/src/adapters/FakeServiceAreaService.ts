import { LocationDomainError, createLocationError } from '../domain/location.errors';
import type { DistanceMethod, LocationResult, ServiceAreaResult } from '../domain/location.types';
import type { ServiceAreaService } from '../ports/location.ports';

export type FakeServiceAreaScenario = 'auto' | 'serviceable' | 'out_of_area' | 'network_error' | 'timeout';

export class FakeServiceAreaService implements ServiceAreaService {
  constructor(
    private readonly scenario: FakeServiceAreaScenario = 'auto',
    private readonly distanceMethod: DistanceMethod = 'route',
  ) {}

  async validate(location: LocationResult): Promise<ServiceAreaResult> {
    if (this.scenario === 'network_error') {
      throw new LocationDomainError(createLocationError('NETWORK_ERROR', 'service_area'));
    }
    if (this.scenario === 'timeout') {
      throw new LocationDomainError(createLocationError('POSITION_TIMEOUT', 'service_area'));
    }
    const outside = this.scenario === 'out_of_area'
      || (this.scenario === 'auto' && location.address.providerReference?.includes('out-of-area'));
    return {
      serviceable: !outside,
      reason: outside ? 'OUTSIDE_RADIUS' : 'SERVICEABLE',
      distanceMeters: outside ? 28_000 : 2_500,
      distanceMethod: this.distanceMethod,
      radiusMeters: 4_000,
      storeId: 'store-fuengirola-01',
      deliveryFeeCents: outside ? null : 449,
      estimatedMinutes: outside ? null : 35,
      quoteId: outside ? null : 'quote-fake-001',
      expiresAt: outside ? null : new Date(Date.now() + 10 * 60 * 1_000).toISOString(),
    };
  }
}
