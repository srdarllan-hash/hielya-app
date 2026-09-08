import { AuthFailure, type AuthFailureCode, type ChallengeResponse, type OtpTransportPort, type VerificationResponse } from '@hielya/application/client-auth';

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const duration = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const knownErrors = new Set(['INVALID_INPUT', 'INVALID_PHONE', 'OTP_INVALID', 'OTP_EXPIRED', 'OTP_UNAVAILABLE', 'OTP_LOCKED', 'OTP_RESEND_COOLDOWN']);

export function createOtpClient(fetcher: typeof fetch = globalThis.fetch, timeoutMs = 15000): OtpTransportPort {
  const post = async (operation: 'request' | 'verify', body: object, signal: AbortSignal): Promise<unknown> => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) controller.abort();
    const timeout = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher(`/api/v1/auth/otp/${operation}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
        signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error',
      });
      let data: unknown;
      try { data = await response.json(); } catch { throw new AuthFailure(response.ok && operation === 'verify' ? 'NETWORK' : 'SERVICE'); }
      if (!response.ok) {
        const code = object(data) && typeof data.code === 'string' && knownErrors.has(data.code) ? data.code as AuthFailureCode : 'SERVICE';
        const retry = response.headers.get('retry-after');
        const seconds = retry !== null && /^\d+$/.test(retry) && Number.isSafeInteger(Number(retry)) ? Number(retry) : undefined;
        throw new AuthFailure(code, seconds);
      }
      if (response.status !== (operation === 'request' ? 202 : 200)) throw new AuthFailure('SERVICE');
      return data;
    } catch (error) {
      if (signal.aborted) throw new AuthFailure('ABORTED');
      if (error instanceof AuthFailure) throw error;
      // A rejected response is uncertain; never infer that verify did not commit.
      throw new AuthFailure('NETWORK');
    } finally {
      clearTimeout(timeout); signal.removeEventListener('abort', abort);
    }
  };
  return {
    async request(phoneE164, signal) {
      if (!/^\+34[0-9]{9}$/.test(phoneE164)) throw new AuthFailure('INVALID_PHONE');
      const data = await post('request', { phoneE164, locale: 'es-ES' }, signal);
      if (!object(data) || !uuid(data.challengeId) || !duration(data.expiresInSeconds) || !duration(data.resendAfterSeconds)) throw new AuthFailure('SERVICE');
      return { challengeId: data.challengeId, expiresInSeconds: data.expiresInSeconds, resendAfterSeconds: data.resendAfterSeconds } satisfies ChallengeResponse;
    },
    async verify(challengeId, code, signal) {
      if (!uuid(challengeId) || !/^[0-9]{6}$/.test(code)) throw new AuthFailure('INVALID_INPUT');
      const data = await post('verify', { challengeId, code }, signal);
      if (!object(data) || typeof data.sessionToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.sessionToken) || !duration(data.expiresInSeconds) || data.expiresInSeconds === 0 || data.expiresInSeconds > 2592000 || !object(data.customer) || !uuid(data.customer.id) || typeof data.customer.phoneE164 !== 'string' || !/^\+34[0-9]{9}$/.test(data.customer.phoneE164) || typeof data.customer.phoneVerifiedAt !== 'string' || !Number.isFinite(Date.parse(data.customer.phoneVerifiedAt)) || data.customer.status !== 'ACTIVE') throw new AuthFailure('NETWORK');
      return { sessionToken: data.sessionToken, expiresInSeconds: data.expiresInSeconds, customer: { id: data.customer.id, phoneE164: data.customer.phoneE164, phoneVerifiedAt: data.customer.phoneVerifiedAt, status: 'ACTIVE' } } satisfies VerificationResponse;
    },
  };
}
