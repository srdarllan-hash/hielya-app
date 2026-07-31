import type { LocationResult } from '../domain/location.types';
import type { LocationRepository } from '../ports/location.ports';

export class MemoryLocationRepository implements LocationRepository {
  private transient: LocationResult | null = null;
  private confirmed: LocationResult | null = null;

  async getCurrent() { return this.confirmed; }
  async saveTransient(location: LocationResult) { this.transient = location; }
  async saveConfirmed(location: LocationResult) { this.confirmed = location; this.transient = null; }
  async clearTransient() { this.transient = null; }
  async clearAll() { this.transient = null; this.confirmed = null; }
}
