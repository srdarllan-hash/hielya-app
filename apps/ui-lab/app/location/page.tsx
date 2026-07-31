import {
  LocationScreen,
  coerceLocationDemoVariant,
  coerceLocationDriver,
  coerceLocationScenario,
  coerceLocationState,
} from '@hielya/ui';
import type { LocationLocale } from '@hielya/location';

const coerceLocale = (value?: string): LocationLocale => value === 'en' || value === 'pt' ? value : 'es';

export default async function LocationPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; driver?: string; scenario?: string; variant?: string; locale?: string }>;
}) {
  const params = await searchParams;
  return (
    <LocationScreen
      initialState={coerceLocationState(params.state)}
      driver={coerceLocationDriver(params.driver)}
      scenario={coerceLocationScenario(params.scenario)}
      demoVariant={coerceLocationDemoVariant(params.variant)}
      locale={coerceLocale(params.locale)}
    />
  );
}
