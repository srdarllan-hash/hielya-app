import {
  LocationDomainError,
  createLocationError,
  type LocationResult,
  type ServiceAreaResult,
  type ServiceAreaService,
} from '@hielya/location';

import {
  DeliveryQuoteClientError,
  createMvpDeliveryQuoteClient,
  type DeliveryQuoteDto,
  type DeliveryQuoteFetch,
  type MvpDeliveryQuoteClient,
} from './delivery-quote-client';

export interface DeliveryQuoteServiceAreaAdapterOptions {
  client?: MvpDeliveryQuoteClient;
  fetch?: DeliveryQuoteFetch;
  timeoutMs?: number;
}

const isCoordinate = (value: number, minimum: number, maximum: number): boolean => (
  Number.isFinite(value) && value >= minimum && value <= maximum
);

const unavailableResult = (
  reason: ServiceAreaResult['reason'],
  distanceMeters: number | null,
  deliveryFeeCents: number | null = null,
): ServiceAreaResult => ({
  serviceable: false,
  reason,
  distanceMeters,
  distanceMethod: 'route',
  radiusMeters: null,
  storeId: null,
  deliveryFeeCents,
  estimatedMinutes: null,
  quoteId: null,
  expiresAt: null,
});

const mapQuote = (quote: DeliveryQuoteDto): ServiceAreaResult => {
  const distanceMeters = quote.routeDistanceKm * 1_000;
  if (quote.publicSpaceBlocked === true) {
    return unavailableResult('PUBLIC_SPACE_NOT_ALLOWED', distanceMeters, quote.feeCents);
  }
  if (!quote.withinArea) {
    return unavailableResult('OUTSIDE_RADIUS', distanceMeters, quote.feeCents);
  }
  return {
    serviceable: true,
    reason: 'SERVICEABLE',
    distanceMeters,
    distanceMethod: 'route',
    radiusMeters: null,
    storeId: null,
    deliveryFeeCents: quote.feeCents,
    estimatedMinutes: null,
    quoteId: null,
    expiresAt: null,
  };
};

const domainError = (
  code: Parameters<typeof createLocationError>[0],
  causeCode: string,
): LocationDomainError => new LocationDomainError(createLocationError(
  code,
  'service_area',
  { recoverable: true, causeCode },
));

export class DeliveryQuoteServiceAreaAdapter implements ServiceAreaService {
  private readonly client: MvpDeliveryQuoteClient;
  private readonly timeoutMs: number | undefined;

  constructor(options: DeliveryQuoteServiceAreaAdapterOptions = {}) {
    this.client = options.client ?? createMvpDeliveryQuoteClient({ fetch: options.fetch });
    this.timeoutMs = options.timeoutMs;
  }

  async validate(location: LocationResult, signal?: AbortSignal): Promise<ServiceAreaResult> {
    const { latitude, longitude } = location.coordinates;
    if (!isCoordinate(latitude, -90, 90) || !isCoordinate(longitude, -180, 180)) {
      throw domainError('ADDRESS_INVALID', 'INVALID_INPUT');
    }

    try {
      const response = await this.client.quoteDelivery(
        { latitude, longitude },
        { signal, ...(this.timeoutMs === undefined ? {} : { timeoutMs: this.timeoutMs }) },
      );
      return mapQuote(response.data);
    } catch (error) {
      if (!(error instanceof DeliveryQuoteClientError)) {
        throw domainError('NETWORK_ERROR', 'NETWORK_ERROR');
      }
      if (error.kind === 'ABORTED') throw domainError('ABORTED', error.kind);
      if (error.kind === 'TIMEOUT') throw domainError('POSITION_TIMEOUT', error.kind);
      if (error.kind === 'NETWORK_ERROR') throw domainError('NETWORK_ERROR', error.kind);
      if (error.kind === 'INVALID_PAYLOAD') {
        throw domainError('DELIVERY_QUOTE_REJECTED', error.kind);
      }

      const publicCode = error.options.publicError?.code;
      if (publicCode === 'OUT_OF_AREA') {
        return unavailableResult('OUTSIDE_RADIUS', null);
      }
      if (publicCode === 'INVALID_INPUT') {
        throw domainError('ADDRESS_INVALID', publicCode);
      }
      if (publicCode === 'CONFIGURATION_UNAVAILABLE') {
        throw domainError('NETWORK_ERROR', publicCode);
      }
      throw domainError('DELIVERY_QUOTE_REJECTED', publicCode ?? error.kind);
    }
  }
}
