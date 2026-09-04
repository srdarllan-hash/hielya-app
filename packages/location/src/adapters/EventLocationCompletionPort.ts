import type { LocationOutcome } from '../domain/location.types';
import type { LocationCompletionPort } from '../ports/location.ports';

export class EventLocationCompletionPort implements LocationCompletionPort {
  complete(outcome: LocationOutcome) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<LocationOutcome>('hielya:location-outcome', { detail: outcome }));
  }
}
