import { LocationDomainError, createLocationError } from '../domain/location.errors';
import { normalizeManualAddressInput } from '../domain/location.normalization';
import type { ManualAddressInput } from '../domain/location.types';
import type { AddressValidationService } from '../ports/location.ports';
import { fakeAddresses } from './fake-data';

export class FakeAddressValidationService implements AddressValidationService {
  async validateManualAddress(input: ManualAddressInput) {
    const normalized = normalizeManualAddressInput(input);
    if (normalized.query.length < 3) {
      throw new LocationDomainError(createLocationError('ADDRESS_INCOMPLETE', 'address_validation', { field: 'query' }));
    }
    const match = fakeAddresses.find((address) => address.formatted.toLowerCase().includes(normalized.query.toLowerCase()));
    if (!match) throw new LocationDomainError(createLocationError('ADDRESS_INVALID', 'address_validation', { field: 'query' }));
    return match;
  }
}
