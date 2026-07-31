import { describe, expect, it } from 'vitest';
import {
  CapturingLocationCompletionPort,
  FakeAddressSearchService,
  FakeGeolocationAdapter,
  FakeReverseGeocodingService,
  FakeServiceAreaService,
  MemoryLocationRepository,
  createLocationController,
  createLocationDependencies,
  createLocationStore,
  fakeAddresses,
} from '@hielya/location';

describe('C-002 ports and fake adapters', () => {
  it('searches and resolves provider-neutral suggestions', async () => {
    const service = new FakeAddressSearchService();
    const suggestions = await service.search({ query: 'Paseo', locale: 'es', countryCodes: ['ES'] });
    expect(suggestions[0]?.providerReference).toMatch(/^fake:/);
    const address = await service.resolveSuggestion(suggestions[0]);
    expect(address.locality).toBe('Fuengirola');
  });

  it('reverse geocodes without a real provider', async () => {
    const address = await new FakeReverseGeocodingService().reverseGeocode({
      coordinates: fakeAddresses[0].coordinates, locale: 'es', countryCodes: ['ES'],
    });
    expect(address.formatted).toContain('Fuengirola');
  });

  it('keeps coverage decision inside ServiceAreaService', async () => {
    const location = {
      source: 'manual' as const, coordinates: fakeAddresses[3].coordinates, address: fakeAddresses[3], confidence: 'exact' as const,
      confirmedByUser: true, confirmedAt: new Date().toISOString(), serviceArea: null, deliveryQuoteId: null,
    };
    const result = await new FakeServiceAreaService('auto').validate(location);
    expect(result.serviceable).toBe(false);
    expect(result.distanceMethod).toBe('route');
  });

  it('does not persist unconfirmed coordinates in memory as current location', async () => {
    const repository = new MemoryLocationRepository();
    const location = {
      source: 'manual' as const, coordinates: fakeAddresses[0].coordinates, address: fakeAddresses[0], confidence: 'exact' as const,
      confirmedByUser: false, confirmedAt: null, serviceArea: null, deliveryQuoteId: null,
    };
    await repository.saveTransient(location);
    expect(await repository.getCurrent()).toBeNull();
  });

  it('emits a typed LOCATION_CONFIRMED outcome without navigation', async () => {
    const completion = new CapturingLocationCompletionPort();
    const dependencies = createLocationDependencies({
      geolocationMode: 'fake',
      repository: new MemoryLocationRepository(),
      completion,
      serviceAreaScenario: 'serviceable',
    });
    const controller = createLocationController(dependencies, createLocationStore());
    await controller.dispatch({ type: 'ENTER_MANUALLY' });
    await controller.dispatch({ type: 'ADDRESS_QUERY_CHANGED', query: 'Paseo' });
    await controller.dispatch({ type: 'SEARCH_ADDRESS' });
    const suggestion = controller.store.getState().suggestions[0];
    await controller.dispatch({ type: 'SELECT_SUGGESTION', suggestion });
    await controller.dispatch({ type: 'CONFIRM_ADDRESS' });
    await controller.dispatch({ type: 'CONTINUE' });
    expect(completion.outcomes).toHaveLength(1);
    expect(completion.outcomes[0]?.type).toBe('LOCATION_CONFIRMED');
  });

  it('normalizes denied fake geolocation', async () => {
    await expect(new FakeGeolocationAdapter('denied').getCurrentPosition({
      enableHighAccuracy: false, timeoutMs: 1000, maximumAgeMs: 0,
    })).rejects.toThrow();
  });
});
