import type {
  AuthChallengeRecord, CustomerAuthenticationErrorCode, CustomerAuthenticationPolicy,
  CustomerAuthenticationFailure, CustomerAuthenticationRepositoryPort, OtpChallengeResult,
  OtpVerificationResult, SessionRecord,
} from '../../application/src/auth';

import type { MvpPersistenceDatabase } from './index';

type ChallengeRow = { challenge_id: string; phone_e164: string; otp_salt: string; otp_hash: string; status: AuthChallengeRecord['status']; attempts_used: number; expires_at: string; resend_available_at: string; delivery_status?: 'PENDING' | 'DELIVERED' | 'FAILED' };
type SessionRow = { session_id: string; customer_id: string; token_hash: string; status: SessionRecord['status']; created_at: string; expires_at: string; revoked_at: string | null; phone_e164: string; phone_verified_at: string };
const challenge = (row: ChallengeRow): AuthChallengeRecord => ({ challengeId: row.challenge_id, phoneE164: row.phone_e164, salt: row.otp_salt, digest: row.otp_hash, status: row.status, attemptsUsed: row.attempts_used, expiresAt: row.expires_at, resendAvailableAt: row.resend_available_at, deliveryStatus: row.delivery_status });

/** SQLite-only adapter. It owns statements and atomic compare-and-set transitions; policy is supplied by application commands. */
export class SqliteCustomerAuthenticationRepository implements CustomerAuthenticationRepositoryPort {
  constructor(private readonly persistence: MvpPersistenceDatabase) {}
  getPolicy(): CustomerAuthenticationPolicy { return this.persistence.customerAuthenticationPolicy(); }
  requestChallenge(command: { challenge: AuthChallengeRecord; deliveryId: string; now: string }): OtpChallengeResult | CustomerAuthenticationErrorCode | CustomerAuthenticationFailure {
    return this.persistence.transaction(() => {
      const latest = this.persistence.db.prepare(`SELECT challenge.*,delivery.status AS delivery_status FROM customer_otp_challenges challenge LEFT JOIN simulated_sms_deliveries delivery ON delivery.challenge_id=challenge.challenge_id WHERE challenge.phone_e164=? ORDER BY challenge.created_at DESC, challenge.rowid DESC LIMIT 1`).get<ChallengeRow>(command.challenge.phoneE164);
      if (latest?.status === 'PENDING' && latest.expires_at <= command.now) this.persistence.db.prepare("UPDATE customer_otp_challenges SET status='EXPIRED',updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, latest.challenge_id);
      if (latest && latest.resend_available_at > command.now) {
        if (latest.status !== 'PENDING' || latest.expires_at <= command.now) {
          return {
            code: 'OTP_RESEND_COOLDOWN',
            retryAfterSeconds: Math.max(
              0,
              Math.ceil((new Date(latest.resend_available_at).getTime() - new Date(command.now).getTime()) / 1_000),
            ),
          };
        }
        if (latest.delivery_status !== 'DELIVERED') return 'OTP_UNAVAILABLE';
        return { challengeId: latest.challenge_id, phoneE164: latest.phone_e164, expiresAt: latest.expires_at, resendAvailableAt: latest.resend_available_at, reused: true };
      }
      if (latest?.status === 'PENDING') this.persistence.db.prepare("UPDATE customer_otp_challenges SET status='SUPERSEDED',updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, latest.challenge_id);
      const value = command.challenge;
      this.persistence.db.prepare("INSERT INTO customer_otp_challenges (challenge_id,phone_e164,otp_salt,otp_hash,status,attempts_used,expires_at,resend_available_at,created_at,updated_at) VALUES (?,?,?,?, 'PENDING',0,?,?,?,?)").run(value.challengeId, value.phoneE164, value.salt, value.digest, value.expiresAt, value.resendAvailableAt, command.now, command.now);
      this.persistence.db.prepare("INSERT INTO simulated_sms_deliveries (delivery_id,challenge_id,phone_e164,provider,status,created_at,updated_at) VALUES (?,?,?,'SIMULATED','PENDING',?,?)").run(command.deliveryId, value.challengeId, value.phoneE164, command.now, command.now);
      return { challengeId: value.challengeId, phoneE164: value.phoneE164, expiresAt: value.expiresAt, resendAvailableAt: value.resendAvailableAt, reused: false };
    });
  }
  markDelivery(command: { deliveryId: string; status: 'DELIVERED' | 'FAILED'; now: string; challengeId: string }): void {
    this.persistence.transaction(() => {
      if (command.status === 'DELIVERED') {
        this.persistence.db.prepare("UPDATE simulated_sms_deliveries SET status='DELIVERED',delivered_at=?,updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, command.now, command.challengeId);
      } else {
        this.persistence.db.prepare("UPDATE simulated_sms_deliveries SET status='FAILED',failed_at=?,updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, command.now, command.challengeId);
        this.persistence.db.prepare("UPDATE customer_otp_challenges SET status='SUPERSEDED',resend_available_at=?,updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, command.now, command.challengeId);
      }
    });
  }
  findChallengeById(challengeId: string): AuthChallengeRecord | undefined { const value = this.persistence.db.prepare('SELECT * FROM customer_otp_challenges WHERE challenge_id=?').get<ChallengeRow>(challengeId); return value ? challenge(value) : undefined; }
  verifyChallenge(command: { challengeId: string; phoneE164: string; now: string; matches: boolean; maxAttempts: number; lockResendAvailableAt: string; customerId: string; sessionId: string; tokenHash: string; sessionExpiresAt: string }): OtpVerificationResult | CustomerAuthenticationErrorCode {
    return this.persistence.transaction(() => {
      const value = this.persistence.db.prepare('SELECT * FROM customer_otp_challenges WHERE challenge_id=? AND phone_e164=?').get<ChallengeRow>(command.challengeId, command.phoneE164);
      if (!value || value.status === 'VERIFIED' || value.status === 'SUPERSEDED') return 'OTP_UNAVAILABLE';
      if (value.status === 'LOCKED') return 'OTP_LOCKED';
      if (value.status === 'EXPIRED' || value.expires_at <= command.now) { if (value.status === 'PENDING') this.persistence.db.prepare("UPDATE customer_otp_challenges SET status='EXPIRED',updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, value.challenge_id); return 'OTP_EXPIRED'; }
      if (!command.matches) { const attempts = value.attempts_used + 1; const locked = attempts >= command.maxAttempts; this.persistence.db.prepare("UPDATE customer_otp_challenges SET attempts_used=?,status=?,resend_available_at=?,updated_at=? WHERE challenge_id=? AND status='PENDING'").run(attempts, locked ? 'LOCKED' : 'PENDING', locked ? command.lockResendAvailableAt : value.resend_available_at, command.now, value.challenge_id); return locked ? 'OTP_LOCKED' : 'INVALID_OTP'; }
      let customer = this.persistence.db.prepare('SELECT customer_id,phone_e164,phone_verified_at FROM customers WHERE phone_e164=?').get<{ customer_id: string; phone_e164: string; phone_verified_at: string }>(command.phoneE164);
      if (!customer) { this.persistence.db.prepare('INSERT INTO customers (customer_id,phone_e164,phone_verified_at,created_at,updated_at) VALUES (?,?,?,?,?)').run(command.customerId, command.phoneE164, command.now, command.now, command.now); customer = { customer_id: command.customerId, phone_e164: command.phoneE164, phone_verified_at: command.now }; }
      this.persistence.db.prepare("UPDATE customer_otp_challenges SET status='VERIFIED',verified_at=?,updated_at=? WHERE challenge_id=? AND status='PENDING'").run(command.now, command.now, value.challenge_id);
      this.persistence.db.prepare("INSERT INTO customer_sessions (session_id,customer_id,token_hash,status,created_at,expires_at,updated_at) VALUES (?,?,?,'ACTIVE',?,?,?)").run(command.sessionId, customer.customer_id, command.tokenHash, command.now, command.sessionExpiresAt, command.now);
      return { customer: { customerId: customer.customer_id, phoneE164: customer.phone_e164, phoneVerifiedAt: customer.phone_verified_at }, session: { sessionId: command.sessionId, token: '', expiresAt: command.sessionExpiresAt } };
    });
  }
  findSession(hash: string): SessionRecord | undefined { const value = this.persistence.db.prepare('SELECT session.*,customer.phone_e164,customer.phone_verified_at FROM customer_sessions session JOIN customers customer ON customer.customer_id=session.customer_id WHERE session.token_hash=?').get<SessionRow>(hash); return value ? { sessionId: value.session_id, customerId: value.customer_id, tokenHash: value.token_hash, status: value.status, createdAt: value.created_at, expiresAt: value.expires_at, revokedAt: value.revoked_at, customer: { customerId: value.customer_id, phoneE164: value.phone_e164, phoneVerifiedAt: value.phone_verified_at } } : undefined; }
  expireSession(sessionId: string, now: string): void { this.persistence.transaction(() => this.persistence.db.prepare("UPDATE customer_sessions SET status='EXPIRED',updated_at=? WHERE session_id=? AND status='ACTIVE'").run(now, sessionId)); }
  revokeSession(sessionId: string, now: string): boolean { return this.persistence.transaction(() => { const result = this.persistence.db.prepare("UPDATE customer_sessions SET status='REVOKED',revoked_at=?,updated_at=? WHERE session_id=? AND status='ACTIVE'").run(now, now, sessionId) as { changes?: number }; return result.changes === 1; }); }
}
