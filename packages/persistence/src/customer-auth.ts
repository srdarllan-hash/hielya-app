import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

import type { CustomerAuthenticationPolicy, MvpPersistenceDatabase } from './index';

export type CustomerAuthenticationErrorCode =
  | 'INVALID_PHONE'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_LOCKED'
  | 'OTP_UNAVAILABLE'
  | 'SESSION_INVALID';

export class CustomerAuthenticationError extends Error {
  constructor(readonly code: CustomerAuthenticationErrorCode) {
    super(code);
    this.name = 'CustomerAuthenticationError';
  }
}

export interface SimulatedSmsMessage {
  challengeId: string;
  phoneE164: string;
  otp: string;
  expiresAt: string;
}

export interface SimulatedSmsGateway {
  send(message: SimulatedSmsMessage): void;
}

export class RecordingSimulatedSmsGateway implements SimulatedSmsGateway {
  readonly messages: SimulatedSmsMessage[] = [];

  send(message: SimulatedSmsMessage): void {
    this.messages.push({ ...message });
  }
}

export interface OtpChallengeResult {
  challengeId: string;
  phoneE164: string;
  expiresAt: string;
  resendAvailableAt: string;
  reused: boolean;
}

export interface VerifiedCustomer {
  customerId: string;
  phoneE164: string;
  phoneVerifiedAt: string;
}

export interface CustomerSessionResult {
  sessionId: string;
  token: string;
  expiresAt: string;
}

export interface OtpVerificationResult {
  customer: VerifiedCustomer;
  session: CustomerSessionResult;
}

export interface ValidatedCustomerSession {
  sessionId: string;
  customer: VerifiedCustomer;
  createdAt: string;
  expiresAt: string;
}

export interface CustomerAuthenticationOptions {
  smsGateway?: SimulatedSmsGateway;
  otpGenerator?: (length: number) => string;
  randomBytes?: (size: number) => Buffer;
  randomId?: () => string;
}

type AuthPersistence = Pick<MvpPersistenceDatabase, 'customerAuthenticationPolicy' | 'db' | 'transaction'>;

interface OtpChallengeRow {
  challenge_id: string;
  phone_e164: string;
  otp_salt: string;
  otp_hash: string;
  status: 'PENDING' | 'VERIFIED' | 'LOCKED' | 'EXPIRED' | 'SUPERSEDED';
  attempts_used: number;
  expires_at: string;
  resend_available_at: string;
  created_at: string;
}

interface SessionRow {
  session_id: string;
  customer_id: string;
  token_hash: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  phone_e164: string;
  phone_verified_at: string;
}

const timestamp = (value: Date | string = new Date()): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('invalid authentication timestamp');
  return date.toISOString();
};

const addSeconds = (value: string, seconds: number): string => (
  new Date(new Date(value).getTime() + seconds * 1_000).toISOString()
);

const defaultOtp = (length: number): string => randomInt(0, 10 ** length)
  .toString()
  .padStart(length, '0');

const hashOtp = (otp: string, saltHex: string): Buffer => scryptSync(
  otp,
  Buffer.from(saltHex, 'hex'),
  32,
  { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
);

const tokenHash = (token: string): string => createHash('sha256').update(token).digest('hex');

export const normalizeSpanishPhone = (
  input: string,
  policy: Pick<CustomerAuthenticationPolicy, 'countryCallingCode' | 'nationalNumberLength' | 'phoneScope'> = {
    countryCallingCode: '+34',
    nationalNumberLength: 9,
    phoneScope: 'ES',
  },
): string => {
  if (policy.phoneScope !== 'ES' || policy.countryCallingCode !== '+34' || policy.nationalNumberLength !== 9) {
    throw new Error('unsupported phone policy');
  }
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value || /[^0-9+().\s-]/.test(value) || (value.match(/\+/g)?.length ?? 0) > 1) {
    throw new CustomerAuthenticationError('INVALID_PHONE');
  }
  const compact = value.replace(/[().\s-]/g, '');
  const national = compact.startsWith('+34')
    ? compact.slice(3)
    : compact.startsWith('0034')
      ? compact.slice(4)
      : compact;
  if (!/^\d{9}$/.test(national)) throw new CustomerAuthenticationError('INVALID_PHONE');
  return `+34${national}`;
};

export class CustomerAuthenticationService {
  private readonly smsGateway: SimulatedSmsGateway;
  private readonly otpGenerator: (length: number) => string;
  private readonly entropy: (size: number) => Buffer;
  private readonly randomId: () => string;

  constructor(
    private readonly persistence: AuthPersistence,
    options: CustomerAuthenticationOptions = {},
  ) {
    this.smsGateway = options.smsGateway ?? { send: () => undefined };
    this.otpGenerator = options.otpGenerator ?? defaultOtp;
    this.entropy = options.randomBytes ?? randomBytes;
    this.randomId = options.randomId ?? randomUUID;
  }

  requestOtp(phone: string, now: Date | string = new Date()): OtpChallengeResult {
    const settings = this.persistence.customerAuthenticationPolicy();
    const phoneE164 = normalizeSpanishPhone(phone, settings);
    const current = timestamp(now);

    return this.persistence.transaction(() => {
      const pending = this.persistence.db.prepare(`
        SELECT * FROM customer_otp_challenges
        WHERE phone_e164=? AND status='PENDING'
      `).get<OtpChallengeRow>(phoneE164);
      if (pending && pending.expires_at <= current) {
        this.persistence.db.prepare(`
          UPDATE customer_otp_challenges
          SET status='EXPIRED',updated_at=?
          WHERE challenge_id=? AND status='PENDING'
        `).run(current, pending.challenge_id);
      } else if (pending && pending.resend_available_at > current) {
        return {
          challengeId: pending.challenge_id,
          phoneE164,
          expiresAt: pending.expires_at,
          resendAvailableAt: pending.resend_available_at,
          reused: true,
        };
      } else if (pending) {
        this.persistence.db.prepare(`
          UPDATE customer_otp_challenges
          SET status='SUPERSEDED',updated_at=?
          WHERE challenge_id=? AND status='PENDING'
        `).run(current, pending.challenge_id);
      }

      const otp = this.otpGenerator(settings.otpLength);
      if (!new RegExp(`^\\d{${settings.otpLength}}$`).test(otp)) {
        throw new Error('OTP generator returned an invalid value');
      }
      const challengeId = this.randomId();
      const salt = this.entropy(16).toString('hex');
      const expiresAt = addSeconds(current, settings.otpTtlSeconds);
      const resendAvailableAt = addSeconds(current, settings.otpResendCooldownSeconds);
      this.persistence.db.prepare(`
        INSERT INTO customer_otp_challenges (
          challenge_id,phone_e164,otp_salt,otp_hash,status,attempts_used,
          expires_at,resend_available_at,created_at,updated_at
        ) VALUES (?,?,?,?, 'PENDING',0,?,?,?,?)
      `).run(
        challengeId,
        phoneE164,
        salt,
        hashOtp(otp, salt).toString('hex'),
        expiresAt,
        resendAvailableAt,
        current,
        current,
      );
      this.smsGateway.send({ challengeId, phoneE164, otp, expiresAt });
      this.persistence.db.prepare(`
        INSERT INTO simulated_sms_deliveries (
          delivery_id,challenge_id,phone_e164,provider,status,delivered_at
        ) VALUES (?,?,?,'SIMULATED','DELIVERED',?)
      `).run(this.randomId(), challengeId, phoneE164, current);
      return { challengeId, phoneE164, expiresAt, resendAvailableAt, reused: false };
    });
  }

  verifyOtp(input: {
    challengeId: string;
    phone: string;
    otp: string;
    now?: Date | string;
  }): OtpVerificationResult {
    const settings = this.persistence.customerAuthenticationPolicy();
    const phoneE164 = normalizeSpanishPhone(input.phone, settings);
    const current = timestamp(input.now);
    if (!new RegExp(`^\\d{${settings.otpLength}}$`).test(input.otp)) {
      throw new CustomerAuthenticationError('INVALID_OTP');
    }

    const outcome = this.persistence.transaction<
      OtpVerificationResult | { error: CustomerAuthenticationErrorCode }
    >(() => {
      const challenge = this.persistence.db.prepare(`
        SELECT * FROM customer_otp_challenges
        WHERE challenge_id=? AND phone_e164=?
      `).get<OtpChallengeRow>(input.challengeId, phoneE164);
      if (!challenge || challenge.status === 'VERIFIED' || challenge.status === 'SUPERSEDED') {
        return { error: 'OTP_UNAVAILABLE' };
      }
      if (challenge.status === 'LOCKED') return { error: 'OTP_LOCKED' };
      if (challenge.status === 'EXPIRED' || challenge.expires_at <= current) {
        if (challenge.status === 'PENDING') {
          this.persistence.db.prepare(`
            UPDATE customer_otp_challenges SET status='EXPIRED',updated_at=?
            WHERE challenge_id=? AND status='PENDING'
          `).run(current, challenge.challenge_id);
        }
        return { error: 'OTP_EXPIRED' };
      }

      const actual = hashOtp(input.otp, challenge.otp_salt);
      const expected = Buffer.from(challenge.otp_hash, 'hex');
      const matches = expected.length === actual.length && timingSafeEqual(actual, expected);
      if (!matches) {
        const attempts = challenge.attempts_used + 1;
        const locked = attempts >= settings.otpMaxVerificationAttempts;
        this.persistence.db.prepare(`
          UPDATE customer_otp_challenges
          SET attempts_used=?,status=?,updated_at=?
          WHERE challenge_id=? AND status='PENDING'
        `).run(attempts, locked ? 'LOCKED' : 'PENDING', current, challenge.challenge_id);
        return { error: locked ? 'OTP_LOCKED' : 'INVALID_OTP' };
      }

      let customer = this.persistence.db.prepare(`
        SELECT customer_id,phone_e164,phone_verified_at
        FROM customers WHERE phone_e164=?
      `).get<{ customer_id: string; phone_e164: string; phone_verified_at: string }>(phoneE164);
      if (!customer) {
        const customerId = this.randomId();
        this.persistence.db.prepare(`
          INSERT INTO customers (
            customer_id,phone_e164,phone_verified_at,created_at,updated_at
          ) VALUES (?,?,?,?,?)
        `).run(customerId, phoneE164, current, current, current);
        customer = { customer_id: customerId, phone_e164: phoneE164, phone_verified_at: current };
      }
      this.persistence.db.prepare(`
        UPDATE customer_otp_challenges
        SET status='VERIFIED',verified_at=?,updated_at=?
        WHERE challenge_id=? AND status='PENDING'
      `).run(current, current, challenge.challenge_id);

      const token = this.entropy(32).toString('hex');
      const sessionId = this.randomId();
      const expiresAt = addSeconds(current, settings.customerSessionTtlSeconds);
      this.persistence.db.prepare(`
        INSERT INTO customer_sessions (
          session_id,customer_id,token_hash,status,created_at,expires_at,updated_at
        ) VALUES (?,?,?,'ACTIVE',?,?,?)
      `).run(sessionId, customer.customer_id, tokenHash(token), current, expiresAt, current);
      return {
        customer: {
          customerId: customer.customer_id,
          phoneE164: customer.phone_e164,
          phoneVerifiedAt: customer.phone_verified_at,
        },
        session: { sessionId, token, expiresAt },
      };
    });

    if ('error' in outcome) throw new CustomerAuthenticationError(outcome.error);
    return outcome;
  }

  validateSession(token: string, now: Date | string = new Date()): ValidatedCustomerSession | null {
    if (!/^[0-9a-f]{64}$/.test(token)) return null;
    const current = timestamp(now);
    return this.persistence.transaction(() => {
      const session = this.findSession(tokenHash(token));
      if (!session || session.status !== 'ACTIVE') return null;
      if (session.expires_at <= current) {
        this.persistence.db.prepare(`
          UPDATE customer_sessions SET status='EXPIRED',updated_at=?
          WHERE session_id=? AND status='ACTIVE'
        `).run(current, session.session_id);
        return null;
      }
      return this.mapSession(session);
    });
  }

  revokeSession(token: string, now: Date | string = new Date()): boolean {
    if (!/^[0-9a-f]{64}$/.test(token)) return false;
    const current = timestamp(now);
    return this.persistence.transaction(() => {
      const session = this.findSession(tokenHash(token));
      if (!session) return false;
      if (session.status === 'REVOKED') return true;
      if (session.status === 'EXPIRED' || session.expires_at <= current) {
        if (session.status === 'ACTIVE') {
          this.persistence.db.prepare(`
            UPDATE customer_sessions SET status='EXPIRED',updated_at=?
            WHERE session_id=? AND status='ACTIVE'
          `).run(current, session.session_id);
        }
        return false;
      }
      this.persistence.db.prepare(`
        UPDATE customer_sessions
        SET status='REVOKED',revoked_at=?,updated_at=?
        WHERE session_id=? AND status='ACTIVE'
      `).run(current, current, session.session_id);
      return true;
    });
  }

  private findSession(hash: string): SessionRow | undefined {
    return this.persistence.db.prepare(`
      SELECT session.*,customer.phone_e164,customer.phone_verified_at
      FROM customer_sessions session
      JOIN customers customer ON customer.customer_id=session.customer_id
      WHERE session.token_hash=?
    `).get<SessionRow>(hash);
  }

  private mapSession(session: SessionRow): ValidatedCustomerSession {
    return {
      sessionId: session.session_id,
      customer: {
        customerId: session.customer_id,
        phoneE164: session.phone_e164,
        phoneVerifiedAt: session.phone_verified_at,
      },
      createdAt: session.created_at,
      expiresAt: session.expires_at,
    };
  }
}
