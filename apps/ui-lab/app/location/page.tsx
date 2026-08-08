import React from 'react';
import {
  LocationScreen,
  coerceLocationDemoVariant,
  coerceLocationDriver,
  coerceLocationScenario,
  coerceLocationState,
} from '@hielya/ui';
import type { LocationLocale } from '@hielya/location';
import { LocationRuntime } from '../../src/client/mvp-local-36/LocationRuntime';

const coerceLocale = (value?: string): LocationLocale => value === 'en' || value === 'pt' ? value : 'es';

export default async function LocationPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; driver?: string; scenario?: string; variant?: string; locale?: string }>;
}) {
  const params = await searchParams;
  const locale = coerceLocale(params.locale);

  if (params.driver !== 'fake') {
    return <LocationRuntime locale={locale} />;
  }

  return (
    <LocationScreen
      initialState={coerceLocationState(params.state)}
      driver={coerceLocationDriver(params.driver)}
      scenario={coerceLocationScenario(params.scenario)}
      demoVariant={coerceLocationDemoVariant(params.variant)}
      locale={locale}
    />
  );
}
