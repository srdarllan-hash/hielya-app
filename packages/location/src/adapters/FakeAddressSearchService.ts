import { LocationDomainError, createLocationError } from '../domain/location.errors';
import type { AddressSearchRequest, AddressSearchService } from '../ports/location.ports';
import { fakeAddresses, fakeSuggestions } from './fake-data';
import type { AddressSuggestion } from '../domain/location.types';
import type { FakeNetworkScenario } from './FakeReverseGeocodingService';

export class FakeAddressSearchService implements AddressSearchService {
  constructor(private readonly scenario: FakeNetworkScenario = 'success') {}

  async search(request: AddressSearchRequest) {
    if (this.scenario === 'network_error') {
      throw new LocationDomainError(createLocationError('NETWORK_ERROR', 'address_search'));
    }
    if (this.scenario === 'timeout') {
      throw new LocationDomainError(createLocationError('POSITION_TIMEOUT', 'address_search'));
    }
    const needle = request.query.trim().toLocaleLowerCase(request.locale);
    return fakeSuggestions.filter((suggestion) => `${suggestion.label} ${suggestion.secondaryLabel ?? ''}`.toLocaleLowerCase(request.locale).includes(needle));
  }

  async resolveSuggestion(suggestion: AddressSuggestion) {
    const address = fakeAddresses.find((item) => item.providerReference === suggestion.providerReference);
    if (!address) throw new LocationDomainError(createLocationError('ADDRESS_INVALID', 'address_validation'));
    return address;
  }
}
