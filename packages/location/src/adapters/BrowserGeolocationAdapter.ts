import { LocationDomainError, createLocationError } from '../domain/location.errors';
import type { Coordinates } from '../domain/location.types';
import type { GeolocationAdapter, GeolocationRequest } from '../ports/location.ports';

const unavailable = () => new LocationDomainError(createLocationError('UNSUPPORTED', 'position', { recoverable: true }));

export class BrowserGeolocationAdapter implements GeolocationAdapter {
  async getPermissionStatus() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported' as const;
    if (!navigator.permissions?.query) return 'unknown' as const;
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state;
    } catch {
      return 'unknown' as const;
    }
  }

  getCurrentPosition(request: GeolocationRequest): Promise<Coordinates> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.reject(unavailable());
    return new Promise((resolve, reject) => {
      let settled = false;
      const abort = () => {
        if (settled) return;
        settled = true;
        reject(new DOMException('Location request aborted', 'AbortError'));
      };
      request.signal?.addEventListener('abort', abort, { once: true });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (settled) return;
          settled = true;
          request.signal?.removeEventListener('abort', abort);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
            capturedAt: new Date(position.timestamp).toISOString(),
            source: 'device',
          });
        },
        (error) => {
          if (settled) return;
          settled = true;
          request.signal?.removeEventListener('abort', abort);
          const code = error.code === error.PERMISSION_DENIED
            ? 'PERMISSION_DENIED'
            : error.code === error.TIMEOUT
              ? 'POSITION_TIMEOUT'
              : 'POSITION_UNAVAILABLE';
          reject(new LocationDomainError(createLocationError(code, 'position', {
            recoverable: code !== 'PERMISSION_DENIED',
            causeCode: String(error.code),
          })));
        },
        {
          enableHighAccuracy: request.enableHighAccuracy,
          timeout: request.timeoutMs,
          maximumAge: request.maximumAgeMs,
        },
      );
    });
  }
}
