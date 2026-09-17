'use client';
import React, { useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocationScreen } from '@hielya/ui';
import { MemoryLocationRepository } from '@hielya/location';
import { createMvpLocationRuntimeDependencies } from '../mvp-local-36/LocationRuntime';
import { useCart } from './CartProvider';
export function CartLocationRuntime() {
  const router = useRouter(); const cart = useCart(); const latest = useRef(cart); useEffect(() => { latest.current = cart; });
  const dependencies = useMemo(() => ({ ...createMvpLocationRuntimeDependencies(), repository: new MemoryLocationRepository(), completion: { complete: (outcome: import('@hielya/location').LocationOutcome) => {
    if (outcome.type === 'LOCATION_CONFIRMED') latest.current.selectLocation(outcome.location);
    router.push('/cart');
  } } }), [router]);
  return <LocationScreen driver="browser" dependencies={dependencies} lockServiceAreaNavigation />;
}
