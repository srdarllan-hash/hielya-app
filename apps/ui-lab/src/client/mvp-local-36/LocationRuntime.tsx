'use client';

import React, { useMemo } from 'react';
import {
  createLocationDependencies,
  type LocationDependencies,
  type LocationLocale,
} from '@hielya/location';
import { LocationScreen } from '@hielya/ui';

import {
  createMvpDeliveryQuoteClient,
  type DeliveryQuoteFetch,
  type MvpDeliveryQuoteClient,
} from './delivery-quote-client';
import { DeliveryQuoteServiceAreaAdapter } from './delivery-quote-service-area-adapter';

export interface CreateMvpLocationRuntimeDependenciesOptions {
  locale?: LocationLocale;
  client?: MvpDeliveryQuoteClient;
  fetch?: DeliveryQuoteFetch;
  requestTimeoutMs?: number;
}

export type LocationRuntimeProps = CreateMvpLocationRuntimeDependenciesOptions;

/**
 * This Gate replaces only FakeServiceAreaService in the public runtime. The
 * existing geocoding doubles remain until a separately authorized real-provider
 * Gate because provider integration is explicitly outside this slice.
 */
export const createMvpLocationRuntimeDependencies = (
  options: CreateMvpLocationRuntimeDependenciesOptions = {},
): LocationDependencies => {
  const locale = options.locale ?? 'es';
  const dependencies = createLocationDependencies({
    locale,
    geolocationMode: 'browser',
  });
  const client = options.client ?? createMvpDeliveryQuoteClient({ fetch: options.fetch });

  return {
    ...dependencies,
    serviceArea: new DeliveryQuoteServiceAreaAdapter({
      client,
      timeoutMs: options.requestTimeoutMs
        ?? dependencies.policies.operation.serviceAreaTimeoutMs,
    }),
  };
};

export function LocationRuntime({
  locale = 'es',
  client,
  fetch,
  requestTimeoutMs,
}: LocationRuntimeProps) {
  const dependencies = useMemo(
    () => createMvpLocationRuntimeDependencies({
      locale,
      client,
      fetch,
      requestTimeoutMs,
    }),
    [client, fetch, locale, requestTimeoutMs],
  );

  return (
    <LocationScreen
      locale={locale}
      driver="browser"
      dependencies={dependencies}
      lockServiceAreaNavigation
    />
  );
}
