import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEVELOPMENT_MIGRATIONS,
  MvpPersistenceDatabase,
  SqliteCustomerAuthenticationRepository,
} from '../../packages/persistence/src/index';
import {
  CustomerAuthenticationError,
  RecordingSimulatedSmsGateway,
  RequestCustomerOtp,
  RevokeCustomerSession,
  ValidateCustomerSession,
  VerifyCustomerOtp,
  normalizeSpanishPhone,
} from '../../packages/application/src/index';

const NOW = '2030-01-01T12:00:00.000Z';
const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

const setup = (otp = '123456') => {
  const persistence = new MvpPersistenceDatabase();
  persistence.migrate();
  persistence.seed(settings);
  const sms = new RecordingSimulatedSmsGateway();
  const repository = new SqliteCustomerAuthenticationRepository(persistence);
  const crypto = { randomBytes: (size: number) => Buffer.alloc(size, 1), randomId: cryptoRandomId, generateOtp: () => otp };
  const pepper = { getPepper: () => Buffer.from('test-pepper') };
  const auth = {
    requestOtp: new RequestCustomerOtp(repository, sms, pepper, crypto).execute.bind(new RequestCustomerOtp(repository, sms, pepper, crypto)),
    verifyOtp: new VerifyCustomerOtp(repository, pepper, crypto).execute.bind(new VerifyCustomerOtp(repository, pepper, crypto)),
    validateSession: new ValidateCustomerSession(repository).execute.bind(new ValidateCustomerSession(repository)),
    revokeSession: new RevokeCustomerSession(repository).execute.bind(new RevokeCustomerSession(repository)),
  };
  return { persistence, sms, auth };
};

let sequence = 0;
const cryptoRandomId = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
const authFor = (persistence: MvpPersistenceDatabase, gateway: { send: (message: { challengeId: string; phoneE164: string; otp: string; expiresAt: string }) => void }, crypto = { randomBytes: (size: number) => Buffer.alloc(size, 1), randomId: cryptoRandomId, generateOtp: () => '123456' }, pepperValue: Buffer | undefined | null = Buffer.from('test-pepper')) => {
  const repository = new SqliteCustomerAuthenticationRepository(persistence);
  const pepper = { getPepper: () => pepperValue ?? undefined };
  const request = new RequestCustomerOtp(repository, gateway, pepper, crypto);
  const verify = new VerifyCustomerOtp(repository, pepper, crypto);
  return { requestOtp: request.execute.bind(request), verifyOtp: verify.execute.bind(verify) };
};

const expectCode = (action: () => unknown, code: string) => {
  try {
    action();
    throw new Error('expected authentication error');
  } catch (error) {
    expect(error).toBeInstanceOf(CustomerAuthenticationError);
    expect((error as CustomerAuthenticationError).code).toBe(code);
  }
};

describe('MVP Local 36 customer authentication foundation', () => {
  it('adds the authentication migration after the three certified migrations', () => {
    expect(DEVELOPMENT_MIGRATIONS).toEqual([
      '0001_mvp_local_36_persistence.sql',
      '0002_mvp_local_36_catalog_read_model.sql',
      '0003_mvp_local_36_inventory_reservation_lifecycle.sql',
      '0004_mvp_local_36_customer_authentication_foundation.sql',
    ]);
  });

  it('applies 0004 additively over a checksummed 0001-0003 database', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.db.exec(`
      CREATE TABLE development_schema_migrations (
        version TEXT PRIMARY KEY,
        sha256 TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    for (const version of DEVELOPMENT_MIGRATIONS.slice(0, 3)) {
      const source = readFileSync(join(process.cwd(), '.dev-migrations', version), 'utf8');
      persistence.db.exec(source);
      persistence.db.prepare(
        'INSERT INTO development_schema_migrations (version,sha256) VALUES (?,?)',
      ).run(version, createHash('sha256').update(source).digest('hex'));
    }
    persistence.db.prepare(`
      INSERT INTO operational_settings (
        id,minimum_product_subtotal_cents,delivery_base_fee_cents,
        delivery_fee_per_km_cents,maximum_road_distance_km,maximum_pin_attempts,
        tips_enabled,inventory_reservation_ttl_seconds
      ) VALUES (1,2500,200,60,4,3,1,600)
    `).run();
    persistence.migrate();
    expect(persistence.customerAuthenticationPolicy()).toMatchObject({
      phoneScope: 'ES', otpTtlSeconds: 300, customerSessionTtlSeconds: 2_592_000,
    });
    expect(persistence.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'customer%' ORDER BY name",
    ).all<{ name: string }>()).toEqual([
      { name: 'customer_otp_challenges' },
      { name: 'customer_sessions' },
      { name: 'customers' },
    ]);
    expect(persistence.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    persistence.close();
  });

  it('persists the exact owner-approved authentication policy', () => {
    const { persistence } = setup();
    expect(persistence.customerAuthenticationPolicy()).toEqual({
      phoneScope: 'ES',
      countryCallingCode: '+34',
      nationalNumberLength: 9,
      otpLength: 6,
      otpTtlSeconds: 300,
      otpResendCooldownSeconds: 60,
      otpMaxVerificationAttempts: 5,
      smsProvider: 'SIMULATED',
      customerSessionTtlSeconds: 2_592_000,
      customerSessionExpiryMode: 'ABSOLUTE',
      publicBrowsingRequiresLogin: false,
      checkoutRequiresLogin: true,
    });
    persistence.close();
  });

  it('normalizes only Spanish phone numbers into canonical E.164', () => {
    expect(normalizeSpanishPhone('612 345 678')).toBe('+34612345678');
    expect(normalizeSpanishPhone('+34 612-345-678')).toBe('+34612345678');
    expect(normalizeSpanishPhone('0034 (612) 345 678')).toBe('+34612345678');
    for (const value of ['+33 612345678', '61234567', '6123456780', 'phone', '+34+612345678']) {
      expectCode(() => normalizeSpanishPhone(value), 'INVALID_PHONE');
    }
  });

  it('completes challenge, simulated delivery, verification, session validation and revocation', () => {
    const { persistence, sms, auth } = setup();
    const challenge = auth.requestOtp('612 345 678', NOW);
    expect(challenge).toEqual({
      challengeId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      phoneE164: '+34612345678',
      expiresAt: '2030-01-01T12:05:00.000Z',
      resendAvailableAt: '2030-01-01T12:01:00.000Z',
      reused: false,
    });
    expect(sms.messages).toEqual([{
      challengeId: challenge.challengeId,
      phoneE164: '+34612345678',
      otp: '123456',
      expiresAt: challenge.expiresAt,
    }]);

    const verified = auth.verifyOtp({
      challengeId: challenge.challengeId,
      otp: '123456',
      now: '2030-01-01T12:00:30.000Z',
    });
    expect(verified.customer.phoneE164).toBe('+34612345678');
    expect(verified.session.token).toMatch(/^[0-9a-f]{64}$/);
    expect(verified.session.expiresAt).toBe('2030-01-31T12:00:30.000Z');
    expect(auth.validateSession(verified.session.token, '2030-01-31T12:00:29.999Z'))
      .toMatchObject({ sessionId: verified.session.sessionId, customer: verified.customer });
    expect(auth.revokeSession(verified.session.token, '2030-01-02T00:00:00.000Z')).toBe(true);
    expect(auth.revokeSession(verified.session.token, '2030-01-02T00:00:01.000Z')).toBe(true);
    expect(auth.validateSession(verified.session.token, '2030-01-02T00:00:02.000Z')).toBeNull();
    persistence.close();
  });

  it('never persists the raw OTP or raw session token', () => {
    const { persistence, auth } = setup('654321');
    const challenge = auth.requestOtp('+34612345678', NOW);
    const verified = auth.verifyOtp({
      challengeId: challenge.challengeId,
      otp: '654321',
      now: NOW,
    });
    const challengeRow = persistence.db.prepare(
      'SELECT * FROM customer_otp_challenges WHERE challenge_id=?',
    ).get<Record<string, unknown>>(challenge.challengeId);
    const deliveryRow = persistence.db.prepare(
      'SELECT * FROM simulated_sms_deliveries WHERE challenge_id=?',
    ).get<Record<string, unknown>>(challenge.challengeId);
    const sessionRow = persistence.db.prepare(
      'SELECT * FROM customer_sessions WHERE session_id=?',
    ).get<Record<string, unknown>>(verified.session.sessionId);
    expect(JSON.stringify([challengeRow, deliveryRow, sessionRow])).not.toContain('654321');
    expect(JSON.stringify(sessionRow)).not.toContain(verified.session.token);
    expect(sessionRow?.token_hash).toBe(createHash('sha256').update(verified.session.token).digest('hex'));
    expect(challengeRow?.otp_salt).toMatch(/^[0-9a-f]{32}$/);
    expect(challengeRow?.otp_hash).toMatch(/^[0-9a-f]{64}$/);
    persistence.close();
  });

  it('requires a non-persisted pepper and binds the digest to challenge id', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.migrate(); persistence.seed(settings);
    expect(() => authFor(persistence, new RecordingSimulatedSmsGateway(), undefined, null).requestOtp('+34612345678', NOW))
      .toThrow('AUTH_CONFIGURATION_UNAVAILABLE');
    const first = authFor(persistence, new RecordingSimulatedSmsGateway()).requestOtp('+34612345678', NOW);
    const row = persistence.db.prepare('SELECT otp_hash,otp_salt FROM customer_otp_challenges WHERE challenge_id=?').get<{ otp_hash: string; otp_salt: string }>(first.challengeId);
    expect(JSON.stringify(row)).not.toContain('test-pepper');
    expect(() => authFor(persistence, new RecordingSimulatedSmsGateway(), undefined, Buffer.from('wrong-pepper')).verifyOtp({ challengeId: first.challengeId, otp: '123456', now: NOW })).toThrow('INVALID_OTP');
    persistence.close();
  });

  it('dispatches simulated SMS outside the write transaction and records failures safely', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.migrate();
    persistence.seed(settings);
    let gatewayObservedTransaction = true;
    const auth = authFor(persistence, { send: () => {
        gatewayObservedTransaction = Boolean((persistence.db as unknown as { isTransaction: boolean }).isTransaction);
        throw new Error('simulated delivery unavailable');
      } });
    expect(() => auth.requestOtp('+34612345678', NOW)).toThrow('simulated delivery unavailable');
    expect(gatewayObservedTransaction).toBe(false);
    expect(persistence.db.prepare('SELECT status,resend_available_at FROM customer_otp_challenges')
      .get<{ status: string; resend_available_at: string }>()).toEqual({
        status: 'SUPERSEDED', resend_available_at: NOW,
      });
    expect(persistence.db.prepare('SELECT status,delivered_at,failed_at FROM simulated_sms_deliveries')
      .get<{ status: string; delivered_at: string | null; failed_at: string | null }>()).toEqual({
        status: 'FAILED', delivered_at: null, failed_at: NOW,
      });
    const retrySms = new RecordingSimulatedSmsGateway();
    const retry = authFor(persistence, retrySms).requestOtp('+34612345678', NOW);
    expect(retry.reused).toBe(false);
    expect(retrySms.messages).toHaveLength(1);
    persistence.close();
  });

  it('counts resend cooldown from a late lock, not challenge creation', () => {
    const { persistence, auth } = setup();
    const challenge = auth.requestOtp('+34612345678', NOW);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expectCode(() => auth.verifyOtp({
        challengeId: challenge.challengeId,
        otp: '000000',
        now: '2030-01-01T12:01:30.000Z',
      }), attempt === 4 ? 'OTP_LOCKED' : 'INVALID_OTP');
    }
    expectCode(
      () => auth.requestOtp('+34612345678', '2030-01-01T12:02:29.999Z'),
      'OTP_RESEND_COOLDOWN',
    );
    const replacement = auth.requestOtp('+34612345678', '2030-01-01T12:02:30.000Z');
    expect(replacement.challengeId).not.toBe(challenge.challengeId);
    persistence.close();
  });

  it('rejects malformed entropy before persisting an OTP or session', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.migrate();
    persistence.seed(settings);
    const badOtpEntropy = authFor(persistence, new RecordingSimulatedSmsGateway(), { randomBytes: () => Buffer.alloc(15), randomId: cryptoRandomId, generateOtp: () => '123456' });
    expect(() => badOtpEntropy.requestOtp('+34612345678', NOW))
      .toThrow('OTP entropy source returned an invalid value');
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customer_otp_challenges')
      .get<{ count: number }>()?.count).toBe(0);

    let entropyCall = 0;
    const badSessionEntropy = authFor(persistence, new RecordingSimulatedSmsGateway(), { randomId: cryptoRandomId, generateOtp: () => '123456', randomBytes: (size) => {
        entropyCall += 1;
        return entropyCall === 1 ? Buffer.alloc(size, 1) : Buffer.alloc(31, 2);
      } });
    const challenge = badSessionEntropy.requestOtp('+34612345678', NOW);
    expect(() => badSessionEntropy.verifyOtp({
      challengeId: challenge.challengeId,
      otp: '123456',
      now: NOW,
    })).toThrow('session entropy source returned an invalid value');
    expect(persistence.db.prepare('SELECT status FROM customer_otp_challenges WHERE challenge_id=?')
      .get<{ status: string }>(challenge.challengeId)?.status).toBe('PENDING');
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customers')
      .get<{ count: number }>()?.count).toBe(0);
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customer_sessions')
      .get<{ count: number }>()?.count).toBe(0);
    persistence.close();
  });

  it('reuses a challenge during cooldown and supersedes it after cooldown', () => {
    const { persistence, sms, auth } = setup();
    const first = auth.requestOtp('+34612345678', NOW);
    const replay = auth.requestOtp('+34612345678', '2030-01-01T12:00:59.999Z');
    expect(replay).toEqual({ ...first, reused: true });
    expect(sms.messages).toHaveLength(1);
    const replacement = auth.requestOtp('+34612345678', '2030-01-01T12:01:00.000Z');
    expect(replacement.challengeId).not.toBe(first.challengeId);
    expect(sms.messages).toHaveLength(2);
    expect(persistence.db.prepare(
      'SELECT status FROM customer_otp_challenges WHERE challenge_id=?',
    ).get<{ status: string }>(first.challengeId)?.status).toBe('SUPERSEDED');
    expectCode(() => auth.verifyOtp({
      challengeId: first.challengeId,
      otp: '123456',
      now: '2030-01-01T12:01:01.000Z',
    }), 'OTP_UNAVAILABLE');
    persistence.close();
  });

  it('locks on the fifth invalid attempt and never creates a customer or session', () => {
    const { persistence, auth } = setup();
    const challenge = auth.requestOtp('+34612345678', NOW);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      expectCode(() => auth.verifyOtp({
        challengeId: challenge.challengeId,
        otp: '000000',
        now: NOW,
      }), 'INVALID_OTP');
    }
    expectCode(() => auth.verifyOtp({
      challengeId: challenge.challengeId,
      otp: '000000',
      now: NOW,
    }), 'OTP_LOCKED');
    expectCode(() => auth.verifyOtp({
      challengeId: challenge.challengeId,
      otp: '123456',
      now: NOW,
    }), 'OTP_LOCKED');
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customers')
      .get<{ count: number }>()?.count).toBe(0);
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customer_sessions')
      .get<{ count: number }>()?.count).toBe(0);
    persistence.close();
  });

  it('expires challenges and sessions at the exact absolute deadline', () => {
    const { persistence, auth } = setup();
    const expired = auth.requestOtp('+34612345678', NOW);
    expectCode(() => auth.verifyOtp({
      challengeId: expired.challengeId,
      otp: '123456',
      now: '2030-01-01T12:05:00.000Z',
    }), 'OTP_EXPIRED');

    const active = auth.requestOtp('+34612345678', '2030-01-01T12:06:00.000Z');
    const verified = auth.verifyOtp({
      challengeId: active.challengeId,
      otp: '123456',
      now: '2030-01-01T12:06:01.000Z',
    });
    expect(auth.validateSession(verified.session.token, verified.session.expiresAt)).toBeNull();
    expect(persistence.db.prepare(
      'SELECT status FROM customer_sessions WHERE session_id=?',
    ).get<{ status: string }>(verified.session.sessionId)?.status).toBe('EXPIRED');
    persistence.close();
  });
});
