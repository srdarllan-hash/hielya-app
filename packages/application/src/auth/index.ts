import { createHash, createHmac, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

export type CustomerAuthenticationErrorCode =
  | 'AUTH_CONFIGURATION_UNAVAILABLE' | 'INVALID_PHONE' | 'INVALID_OTP' | 'OTP_EXPIRED'
  | 'OTP_LOCKED' | 'OTP_RESEND_COOLDOWN' | 'OTP_UNAVAILABLE' | 'SESSION_INVALID';

export class CustomerAuthenticationError extends Error {
  constructor(
    readonly code: CustomerAuthenticationErrorCode,
    readonly retryAfterSeconds?: number,
  ) { super(code); this.name = 'CustomerAuthenticationError'; }
}

export interface CustomerAuthenticationPolicy {
  phoneScope: 'ES'; countryCallingCode: '+34'; nationalNumberLength: 9; otpLength: 6;
  otpTtlSeconds: number; otpResendCooldownSeconds: number; otpMaxVerificationAttempts: number;
  smsProvider: 'SIMULATED'; customerSessionTtlSeconds: number; customerSessionExpiryMode: 'ABSOLUTE';
  publicBrowsingRequiresLogin: false; checkoutRequiresLogin: true;
}
export interface SimulatedSmsMessage { challengeId: string; phoneE164: string; otp: string; expiresAt: string; }
export interface OtpDeliveryPort { send(message: SimulatedSmsMessage): void; }
export interface OtpPepperPort { getPepper(): Buffer | undefined; }
export interface AuthenticationCryptoPort { randomBytes(size: number): Buffer; randomId(): string; generateOtp(length: number): string; }
export interface OtpChallengeResult { challengeId: string; phoneE164: string; expiresAt: string; resendAvailableAt: string; reused: boolean; }
export interface CustomerAuthenticationFailure { code: CustomerAuthenticationErrorCode; retryAfterSeconds?: number; }
export interface VerifiedCustomer { customerId: string; phoneE164: string; phoneVerifiedAt: string; }
export interface CustomerSessionResult { sessionId: string; token: string; expiresAt: string; }
export interface OtpVerificationResult { customer: VerifiedCustomer; session: CustomerSessionResult; }
export interface ValidatedCustomerSession { sessionId: string; customer: VerifiedCustomer; createdAt: string; expiresAt: string; }
export type ChallengeStatus = 'PENDING' | 'VERIFIED' | 'LOCKED' | 'EXPIRED' | 'SUPERSEDED';
export interface AuthChallengeRecord { challengeId: string; phoneE164: string; salt: string; digest: string; status: ChallengeStatus; attemptsUsed: number; expiresAt: string; resendAvailableAt: string; deliveryStatus?: 'PENDING' | 'DELIVERED' | 'FAILED'; }
export interface SessionRecord { sessionId: string; customerId: string; tokenHash: string; status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'; createdAt: string; expiresAt: string; revokedAt: string | null; customer: VerifiedCustomer; }
export interface CustomerAuthenticationRepositoryPort {
  getPolicy(): CustomerAuthenticationPolicy;
  requestChallenge(command: { challenge: AuthChallengeRecord; deliveryId: string; now: string }): OtpChallengeResult | CustomerAuthenticationErrorCode | CustomerAuthenticationFailure;
  markDelivery(command: { deliveryId: string; status: 'DELIVERED' | 'FAILED'; now: string; challengeId: string }): void;
  findChallengeById(challengeId: string): AuthChallengeRecord | undefined;
  verifyChallenge(command: { challengeId: string; phoneE164: string; now: string; matches: boolean; maxAttempts: number; lockResendAvailableAt: string; customerId: string; sessionId: string; tokenHash: string; sessionExpiresAt: string }): OtpVerificationResult | CustomerAuthenticationErrorCode;
  findSession(tokenHash: string): SessionRecord | undefined;
  expireSession(sessionId: string, now: string): void;
  revokeSession(sessionId: string, now: string): boolean;
}
export class RecordingSimulatedSmsGateway implements OtpDeliveryPort { readonly messages: SimulatedSmsMessage[] = []; send(message: SimulatedSmsMessage): void { this.messages.push({ ...message }); } }
export const nodeAuthenticationCrypto: AuthenticationCryptoPort = { randomBytes, randomId: randomUUID, generateOtp: (length) => randomInt(0, 10 ** length).toString().padStart(length, '0') };
const timestamp = (value: Date | string = new Date()): string => { const date = value instanceof Date ? value : new Date(value); if (!Number.isFinite(date.getTime())) throw new Error('invalid authentication timestamp'); return date.toISOString(); };
const addSeconds = (value: string, seconds: number): string => new Date(new Date(value).getTime() + seconds * 1_000).toISOString();
const tokenHash = (token: string): string => createHash('sha256').update(token).digest('hex');
const validSalt = (salt: string): boolean => /^[0-9a-f]{32}$/.test(salt);
export const normalizeSpanishPhone = (input: string, policy: Pick<CustomerAuthenticationPolicy, 'countryCallingCode' | 'nationalNumberLength' | 'phoneScope'> = { countryCallingCode: '+34', nationalNumberLength: 9, phoneScope: 'ES' }): string => { if (policy.phoneScope !== 'ES' || policy.countryCallingCode !== '+34' || policy.nationalNumberLength !== 9) throw new Error('unsupported phone policy'); const value = typeof input === 'string' ? input.trim() : ''; if (!value || /[^0-9+().\s-]/.test(value) || (value.match(/\+/g)?.length ?? 0) > 1) throw new CustomerAuthenticationError('INVALID_PHONE'); const compact = value.replace(/[().\s-]/g, ''); const national = compact.startsWith('+34') ? compact.slice(3) : compact.startsWith('0034') ? compact.slice(4) : compact; if (!/^\d{9}$/.test(national)) throw new CustomerAuthenticationError('INVALID_PHONE'); return `+34${national}`; };

export class RequestCustomerOtp {
  constructor(private readonly repository: CustomerAuthenticationRepositoryPort, private readonly gateway: OtpDeliveryPort, private readonly pepper: OtpPepperPort, private readonly crypto: AuthenticationCryptoPort = nodeAuthenticationCrypto) {}
  execute(phone: string, now: Date | string = new Date()): OtpChallengeResult {
    const policy = this.repository.getPolicy(); const current = timestamp(now); const phoneE164 = normalizeSpanishPhone(phone, policy); const pepper = this.pepper.getPepper();
    if (!pepper || pepper.length === 0) throw new CustomerAuthenticationError('AUTH_CONFIGURATION_UNAVAILABLE');
    const otp = this.crypto.generateOtp(policy.otpLength); if (!new RegExp(`^\\d{${policy.otpLength}}$`).test(otp)) throw new Error('OTP generator returned an invalid value');
    const saltBytes = this.crypto.randomBytes(16); if (!Buffer.isBuffer(saltBytes) || saltBytes.length !== 16) throw new Error('OTP entropy source returned an invalid value');
    const challengeId = this.crypto.randomId(); const deliveryId = this.crypto.randomId(); const context = `${challengeId}:${otp}`; const preimage = createHmac('sha256', pepper).update(context).digest(); const digest = scryptSync(preimage, saltBytes, 32, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
    const result = this.repository.requestChallenge({ challenge: { challengeId, phoneE164, salt: saltBytes.toString('hex'), digest, status: 'PENDING', attemptsUsed: 0, expiresAt: addSeconds(current, policy.otpTtlSeconds), resendAvailableAt: addSeconds(current, policy.otpResendCooldownSeconds) }, deliveryId, now: current });
    if (typeof result === 'string') throw new CustomerAuthenticationError(result);
    if ('code' in result) throw new CustomerAuthenticationError(result.code, result.retryAfterSeconds);
    if (result.reused) return result;
    try { this.gateway.send({ challengeId, phoneE164, otp, expiresAt: result.expiresAt }); this.repository.markDelivery({ deliveryId, status: 'DELIVERED', now: current, challengeId }); return result; } catch (error) { this.repository.markDelivery({ deliveryId, status: 'FAILED', now: current, challengeId }); throw error; }
  }
}
export class VerifyCustomerOtp {
  constructor(private readonly repository: CustomerAuthenticationRepositoryPort, private readonly pepper: OtpPepperPort, private readonly crypto: AuthenticationCryptoPort = nodeAuthenticationCrypto) {}
  execute(input: { challengeId: string; otp: string; now?: Date | string }): OtpVerificationResult {
    const policy = this.repository.getPolicy(); const current = timestamp(input.now); const pepper = this.pepper.getPepper(); if (!pepper || pepper.length === 0) throw new CustomerAuthenticationError('AUTH_CONFIGURATION_UNAVAILABLE'); if (!new RegExp(`^\\d{${policy.otpLength}}$`).test(input.otp)) throw new CustomerAuthenticationError('INVALID_OTP');
    const snapshot = this.repository.findChallengeById(input.challengeId); const phoneE164 = snapshot?.phoneE164 ?? ''; const salt = snapshot?.salt; const actual = salt && validSalt(salt) ? scryptSync(createHmac('sha256', pepper).update(`${input.challengeId}:${input.otp}`).digest(), Buffer.from(salt, 'hex'), 32, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex') : '';
    const matches = Boolean(snapshot && actual && /^[0-9a-f]{64}$/.test(snapshot.digest) && timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(snapshot.digest, 'hex')));
    const tokenBytes = this.crypto.randomBytes(32); if (!Buffer.isBuffer(tokenBytes) || tokenBytes.length !== 32) throw new Error('session entropy source returned an invalid value'); const token = tokenBytes.toString('hex');
    const result = this.repository.verifyChallenge({ challengeId: input.challengeId, phoneE164, now: current, matches, maxAttempts: policy.otpMaxVerificationAttempts, lockResendAvailableAt: addSeconds(current, policy.otpResendCooldownSeconds), customerId: this.crypto.randomId(), sessionId: this.crypto.randomId(), tokenHash: tokenHash(token), sessionExpiresAt: addSeconds(current, policy.customerSessionTtlSeconds) });
    if (typeof result === 'string') throw new CustomerAuthenticationError(result); return { ...result, session: { ...result.session, token } };
  }
}
export class ValidateCustomerSession { constructor(private readonly repository: CustomerAuthenticationRepositoryPort) {} execute(token: string, now: Date | string = new Date()): ValidatedCustomerSession | null { if (!/^[0-9a-f]{64}$/.test(token)) return null; const current = timestamp(now); const session = this.repository.findSession(tokenHash(token)); if (!session || session.status !== 'ACTIVE') return null; if (session.expiresAt <= current) { this.repository.expireSession(session.sessionId, current); return null; } return { sessionId: session.sessionId, customer: session.customer, createdAt: session.createdAt, expiresAt: session.expiresAt }; } }
export class RevokeCustomerSession { constructor(private readonly repository: CustomerAuthenticationRepositoryPort) {} execute(token: string, now: Date | string = new Date()): boolean { if (!/^[0-9a-f]{64}$/.test(token)) return false; const current = timestamp(now); const session = this.repository.findSession(tokenHash(token)); if (!session) return false; if (session.status === 'REVOKED') return true; if (session.status === 'EXPIRED' || session.expiresAt <= current) { if (session.status === 'ACTIVE') this.repository.expireSession(session.sessionId, current); return false; } return this.repository.revokeSession(session.sessionId, current); } }
