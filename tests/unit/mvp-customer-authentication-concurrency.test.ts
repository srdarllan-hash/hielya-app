import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  CustomerAuthenticationError,
  CustomerAuthenticationService,
  MvpPersistenceDatabase,
  RecordingSimulatedSmsGateway,
} from '../../packages/persistence/src/index';

const NOW = '2030-01-01T12:00:00.000Z';
const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};
const directories: string[] = [];

const setup = () => {
  const directory = mkdtempSync(join(tmpdir(), 'hielya-auth-concurrency-'));
  directories.push(directory);
  const filename = join(directory, 'auth.sqlite');
  const firstDb = new MvpPersistenceDatabase(filename);
  firstDb.migrate();
  firstDb.seed(settings);
  const secondDb = new MvpPersistenceDatabase(filename);
  secondDb.migrate();
  const firstSms = new RecordingSimulatedSmsGateway();
  const secondSms = new RecordingSimulatedSmsGateway();
  return {
    firstDb,
    secondDb,
    first: new CustomerAuthenticationService(firstDb, {
      smsGateway: firstSms,
      otpGenerator: () => '123456',
    }),
    second: new CustomerAuthenticationService(secondDb, {
      smsGateway: secondSms,
      otpGenerator: () => '123456',
    }),
    firstSms,
    secondSms,
  };
};

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('MVP Local 36 customer authentication multi-connection invariants', () => {
  it('serializes writes and permits one pending challenge and delivery during cooldown', () => {
    const { firstDb, secondDb, first, second, firstSms, secondSms } = setup();
    firstDb.db.exec('BEGIN IMMEDIATE');
    try {
      expect(() => second.requestOtp('+34612345678', NOW)).toThrow(/locked|busy/i);
    } finally {
      firstDb.db.exec('ROLLBACK');
    }
    const created = first.requestOtp('+34612345678', NOW);
    expect(second.requestOtp('+34612345678', '2030-01-01T12:00:30.000Z'))
      .toEqual({ ...created, reused: true });
    expect(firstSms.messages).toHaveLength(1);
    expect(secondSms.messages).toHaveLength(0);
    expect(secondDb.db.prepare(`
      SELECT COUNT(*) AS count FROM customer_otp_challenges WHERE status='PENDING'
    `).get<{ count: number }>()?.count).toBe(1);
    expect(secondDb.db.prepare('SELECT COUNT(*) AS count FROM simulated_sms_deliveries')
      .get<{ count: number }>()?.count).toBe(1);
    firstDb.close();
    secondDb.close();
  });

  it('allows a challenge to be verified only once with one customer and one session', () => {
    const { firstDb, secondDb, first, second } = setup();
    const challenge = first.requestOtp('+34612345678', NOW);
    const winner = second.verifyOtp({
      challengeId: challenge.challengeId,
      phone: '+34612345678',
      otp: '123456',
      now: NOW,
    });
    expect(() => first.verifyOtp({
      challengeId: challenge.challengeId,
      phone: '+34612345678',
      otp: '123456',
      now: NOW,
    })).toThrowError(CustomerAuthenticationError);
    expect(firstDb.db.prepare('SELECT COUNT(*) AS count FROM customers')
      .get<{ count: number }>()?.count).toBe(1);
    expect(firstDb.db.prepare('SELECT COUNT(*) AS count FROM customer_sessions')
      .get<{ count: number }>()?.count).toBe(1);
    expect(first.validateSession(winner.session.token, NOW)?.customer.customerId)
      .toBe(winner.customer.customerId);
    firstDb.close();
    secondDb.close();
  });

  it('atomically increments failed attempts across connections and locks at five', () => {
    const { firstDb, secondDb, first, second } = setup();
    const challenge = first.requestOtp('+34612345678', NOW);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(() => (attempt % 2 === 0 ? first : second).verifyOtp({
        challengeId: challenge.challengeId,
        phone: '+34612345678',
        otp: '000000',
        now: NOW,
      })).toThrowError(CustomerAuthenticationError);
    }
    expect(() => second.verifyOtp({
      challengeId: challenge.challengeId,
      phone: '+34612345678',
      otp: '000000',
      now: NOW,
    })).toThrowError(CustomerAuthenticationError);
    expect(firstDb.db.prepare(`
      SELECT status,attempts_used FROM customer_otp_challenges WHERE challenge_id=?
    `).get<{ status: string; attempts_used: number }>(challenge.challengeId))
      .toEqual({ status: 'LOCKED', attempts_used: 5 });
    expect(firstDb.db.prepare('SELECT COUNT(*) AS count FROM customer_sessions')
      .get<{ count: number }>()?.count).toBe(0);
    firstDb.close();
    secondDb.close();
  });
});
