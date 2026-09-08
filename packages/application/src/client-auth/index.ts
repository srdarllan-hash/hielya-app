/** Browser-safe application boundary. Never log, persist or serialize OTP/session values. */
export interface AuthSession {
  sessionToken: string;
  expiresAt: number;
  customer: { id: string; phoneE164: string; phoneVerifiedAt: string; status: 'ACTIVE' };
}
export interface SessionPort {
  read(): AuthSession | undefined;
  write(session: AuthSession): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}
/** Integration seam for a future secure-storage ADR. This adapter intentionally loses state on reload. */
export function createMemorySessionStore(now: () => number = Date.now): SessionPort {
  let session: AuthSession | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  return {
    read() { return session && session.expiresAt > now() ? session : undefined; },
    write(value) { session = value; notify(); },
    clear() { if (session) { session = undefined; notify(); } },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
export type AuthFailureCode = 'NETWORK' | 'ABORTED' | 'INVALID_INPUT' | 'INVALID_PHONE' | 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_UNAVAILABLE' | 'OTP_LOCKED' | 'OTP_RESEND_COOLDOWN' | 'SERVICE';
export class AuthFailure extends Error {
  constructor(readonly code: AuthFailureCode, readonly retryAfterSeconds?: number) {
    super('Authentication operation failed.');
    this.name = 'AuthFailure';
  }
}
export interface ChallengeResponse { challengeId: string; expiresInSeconds: number; resendAfterSeconds: number; }
export interface VerificationResponse { sessionToken: string; expiresInSeconds: number; customer: AuthSession['customer']; }
export interface OtpTransportPort {
  request(phoneE164: string, signal: AbortSignal): Promise<ChallengeResponse>;
  verify(challengeId: string, code: string, signal: AbortSignal): Promise<VerificationResponse>;
}
export type VerificationState = 'idle' | 'loading' | 'invalid' | 'expired' | 'locked' | 'network-error' | 'unavailable' | 'service-unavailable' | 'success';
export interface AuthFlowSnapshot {
  screen: 'phone' | 'otp' | 'success';
  nationalDigits: string;
  maskedPhone: string;
  requesting: boolean;
  requestError?: 'phone' | 'network' | 'service' | 'cooldown';
  verification: VerificationState;
  expiresSeconds: number;
  resendSeconds: number;
  resendBlocked: boolean;
  challengeVersion: number;
}
export function createAuthFlow(transport: OtpTransportPort, sessions: SessionPort, now: () => number = Date.now) {
  let snapshot: AuthFlowSnapshot = { screen: 'phone', nationalDigits: '', maskedPhone: '', requesting: false, verification: 'idle', expiresSeconds: 0, resendSeconds: 0, resendBlocked: false, challengeVersion: 0 };
  let challenge: { id: string; expiresAt: number } | undefined;
  // These values remain private and ephemeral, never exposed by snapshot/subscriptions.
  let retryCode: string | undefined;
  let controller: AbortController | undefined;
  let sequence = 0;
  let busy = false;
  const cooldowns = new Map<string, number>();
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<AuthFlowSnapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach(fn => fn()); };
  const remaining = (deadline: number) => Math.max(0, Math.ceil((deadline - now()) / 1000));
  const tick = () => {
    const deadline = cooldowns.get(snapshot.nationalDigits) ?? 0;
    const expiresSeconds = challenge ? remaining(challenge.expiresAt) : 0;
    const resendSeconds = Number.isFinite(deadline) ? remaining(deadline) : 0;
    const resendBlocked = deadline > now();
    if (snapshot.expiresSeconds !== expiresSeconds || snapshot.resendSeconds !== resendSeconds || snapshot.resendBlocked !== resendBlocked) publish({ expiresSeconds, resendSeconds, resendBlocked });
  };
  const imposeCooldown = (seconds?: number) => {
    const deadline = seconds !== undefined && Number.isFinite(seconds) && seconds >= 0 ? now() + seconds * 1000 : Infinity;
    cooldowns.set(snapshot.nationalDigits, Math.max(cooldowns.get(snapshot.nationalDigits) ?? 0, deadline));
    tick();
  };
  const cancel = () => { sequence += 1; controller?.abort(); controller = undefined; busy = false; retryCode = undefined; };
  const request = async () => {
    tick();
    if (busy || snapshot.screen === 'success' || snapshot.resendBlocked) return;
    if (!/^[0-9]{9}$/.test(snapshot.nationalDigits)) { publish({ requestError: 'phone' }); return; }
    busy = true;
    const attempt = ++sequence;
    controller = new AbortController();
    const started = now();
    publish({ requesting: true, requestError: undefined });
    try {
      const response = await transport.request(`+34${snapshot.nationalDigits}`, controller.signal);
      if (attempt !== sequence) return;
      challenge = { id: response.challengeId, expiresAt: started + response.expiresInSeconds * 1000 };
      // Response-arrival anchoring is conservative: never expose resend earlier than the server interval.
      cooldowns.set(snapshot.nationalDigits, now() + response.resendAfterSeconds * 1000);
      retryCode = undefined;
      publish({ screen: 'otp', maskedPhone: `+34 ******${snapshot.nationalDigits.slice(-3)}`, verification: 'idle', challengeVersion: snapshot.challengeVersion + 1 });
    } catch (error) {
      if (attempt !== sequence) return;
      const failure = error instanceof AuthFailure ? error : new AuthFailure('SERVICE');
      if (failure.code === 'OTP_RESEND_COOLDOWN' || failure.code === 'OTP_LOCKED') imposeCooldown(failure.retryAfterSeconds);
      publish({ requestError: failure.code === 'NETWORK' ? 'network' : failure.code === 'INVALID_PHONE' || failure.code === 'INVALID_INPUT' ? 'phone' : failure.code === 'OTP_RESEND_COOLDOWN' || failure.code === 'OTP_LOCKED' ? 'cooldown' : 'service' });
    } finally {
      if (attempt === sequence) { busy = false; controller = undefined; publish({ requesting: false }); tick(); }
    }
  };
  const verify = async (code: string, explicitRetry = false) => {
    if (busy || !challenge || snapshot.screen !== 'otp' || !/^[0-9]{6}$/.test(code)) return;
    if (['expired', 'locked', 'unavailable', 'success'].includes(snapshot.verification)) return;
    if (explicitRetry && (!retryCode || retryCode !== code || !['network-error', 'service-unavailable'].includes(snapshot.verification))) return;
    if (!explicitRetry && ['network-error', 'service-unavailable'].includes(snapshot.verification) && retryCode === code) return;
    busy = true;
    const attempt = ++sequence;
    controller = new AbortController();
    const started = now();
    retryCode = code;
    publish({ verification: 'loading', requestError: undefined });
    try {
      const response = await transport.verify(challenge.id, code, controller.signal);
      if (attempt !== sequence) return;
      if (response.customer.phoneE164 !== `+34${snapshot.nationalDigits}`) throw new AuthFailure('NETWORK');
      sessions.write({ sessionToken: response.sessionToken, customer: response.customer, expiresAt: started + response.expiresInSeconds * 1000 });
      retryCode = undefined; challenge = undefined;
      publish({ screen: 'success', verification: 'success', nationalDigits: '', maskedPhone: '', expiresSeconds: 0 });
    } catch (error) {
      if (attempt !== sequence) return;
      const failure = error instanceof AuthFailure ? error : new AuthFailure('SERVICE');
      const mapping: Partial<Record<AuthFailureCode, VerificationState>> = { NETWORK: 'network-error', OTP_INVALID: 'invalid', OTP_EXPIRED: 'expired', OTP_UNAVAILABLE: 'unavailable', OTP_LOCKED: 'locked', OTP_RESEND_COOLDOWN: 'locked' };
      const verification = mapping[failure.code] ?? 'service-unavailable';
      if (failure.code === 'OTP_LOCKED' || failure.code === 'OTP_RESEND_COOLDOWN') imposeCooldown(failure.retryAfterSeconds);
      if (!['network-error', 'service-unavailable'].includes(verification)) retryCode = undefined;
      publish({ verification });
    } finally {
      if (attempt === sequence) { busy = false; controller = undefined; tick(); }
    }
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setPhone(digits: string) { if (busy || snapshot.screen !== 'phone' || !/^[0-9]{0,9}$/.test(digits)) return; publish({ nationalDigits: digits, requestError: undefined }); tick(); },
    request,
    verify: (code: string) => verify(code),
    retry: (displayedCode = retryCode) => displayedCode ? verify(displayedCode, true) : Promise.resolve(),
    tick,
    changeNumber() { cancel(); challenge = undefined; publish({ screen: 'phone', requesting: false, verification: 'idle', requestError: undefined, expiresSeconds: 0 }); tick(); },
    cancel,
  };
}
