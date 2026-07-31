import { initialLocationContext, transitionLocation, type LocationContext } from '../domain/location.machine';
import type { LocationEvent } from '../domain/location.events';
import type { LocationStore } from '../ports/location.ports';

export function createLocationStore(seed: Partial<LocationContext> = {}): LocationStore {
  let state: LocationContext = { ...initialLocationContext, ...seed };
  const listeners = new Set<(value: LocationContext) => void>();
  return {
    getState: () => state,
    dispatch: (event: LocationEvent) => {
      const transition = transitionLocation(state, event);
      state = transition.context;
      listeners.forEach((listener) => listener(state));
      return transition.effects;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
