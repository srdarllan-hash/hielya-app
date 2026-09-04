import type { LocationRetentionPolicy } from '../domain/location.policies';
import type { LocationResult } from '../domain/location.types';
import type { LocationRepository } from '../ports/location.ports';

interface StoredLocation {
  value: LocationResult;
  expiresAt: number;
}

export class SessionLocationRepository implements LocationRepository {
  private transient: LocationResult | null = null;

  constructor(
    private readonly retention: LocationRetentionPolicy,
    private readonly key = 'hielya.location.confirmed.v1',
  ) {}

  async getCurrent(): Promise<LocationResult | null> {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw) as StoredLocation;
      if (stored.expiresAt <= Date.now()) {
        sessionStorage.removeItem(this.key);
        return null;
      }
      return stored.value;
    } catch {
      sessionStorage.removeItem(this.key);
      return null;
    }
  }

  async saveTransient(location: LocationResult) {
    this.transient = location;
  }

  async saveConfirmed(location: LocationResult) {
    this.transient = null;
    if (typeof sessionStorage === 'undefined') return;
    const stored: StoredLocation = {
      value: location,
      expiresAt: Date.now() + this.retention.confirmedGuestTtlMs,
    };
    sessionStorage.setItem(this.key, JSON.stringify(stored));
  }

  async clearTransient() { this.transient = null; }
  async clearAll() {
    this.transient = null;
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.key);
  }
}
