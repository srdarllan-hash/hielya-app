import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  CustomerAuthenticationError,
  RecordingSimulatedSmsGateway,
  RequestCustomerOtp,
  VerifyCustomerOtp,
} from '../../packages/application/src';
import {
  MvpPersistenceDatabase,
  SqliteCustomerAuthenticationRepository,
} from '../../packages/persistence/src';
import {
  createAuthHttpHandlers,
  type AuthHttpHandlerDependencies,
} from '../../apps/ui-lab/src/server/mvp-local-36/auth-http';
import { createRuntimeAuthHandlers } from '../../apps/ui-lab/src/server/mvp-local-36/auth-container';

const NOW = new Date('2030-01-01T12:00:00.000Z');
const CORRELATION_ID = '00000000-0000-4000-8000-000000000099';
const CHALLENGE_ID = '00000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = '00000000-0000-4000-8000-000000000002';
const directories: string[] = [];
const mutableEnvironment = process.env as Record<string, string | undefined>;
const originalEnvironment = {
  nodeEnv: process.env.NODE_ENV,
  databasePath: process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH,
  pepper: process.env.HIELYA_OTP_PEPPER,
};

const restoreEnvironment = () => {
  if (originalEnvironment.nodeEnv === undefined) delete mutableEnvironment.NODE_ENV;
  else mutableEnvironment.NODE_ENV = originalEnvironment.nodeEnv;
  if (originalEnvironment.databasePath === undefined) {
    delete process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH;
  } else process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH = originalEnvironment.databasePath;
  if (originalEnvironment.pepper === undefined) delete process.env.HIELYA_OTP_PEPPER;
  else process.env.HIELYA_OTP_PEPPER = originalEnvironment.pepper;
};

afterEach(() => {
  restoreEnvironment();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const jsonRequest = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Request => new Request(`http://localhost${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const fakeHandlers = (overrides: {
  requestOtp?: AuthHttpHandlerDependencies['requestOtp'];
  verifyOtp?: AuthHttpHandlerDependencies['verifyOtp'];
} = {}) => createAuthHttpHandlers({
  requestOtp: overrides.requestOtp ?? {
    execute: () => ({
      challengeId: CHALLENGE_ID,
      phoneE164: '+34612345678',
      expiresAt: '2030-01-01T12:05:00.000Z',
      resendAvailableAt: '2030-01-01T12:01:00.000Z',
      reused: false,
    }),
  },
  verifyOtp: overrides.verifyOtp ?? {
    execute: () => ({
      customer: {
        customerId: CUSTOMER_ID,
        phoneE164: '+34612345678',
        phoneVerifiedAt: NOW.toISOString(),
      },
      session: {
        sessionId: '00000000-0000-4000-8000-000000000003',
        token: 'a'.repeat(64),
        expiresAt: '2030-01-31T12:00:00.000Z',
      },
    }),
  },
  correlationIds: { generate: () => CORRELATION_ID },
  clock: { now: () => new Date(NOW) },
});

describe('MVP Local 36 OTP HTTP transport', () => {
  it('returns a strict 202 challenge without phone, OTP or internal state', async () => {
    const response = await fakeHandlers().requestOtp(jsonRequest('/api/v1/auth/otp/request', {
      phoneE164: '+34612345678',
      locale: 'es-ES',
    }));
    expect(response.status).toBe(202);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('x-correlation-id')).toBe(CORRELATION_ID);
    const body = await response.json();
    expect(body).toEqual({
      challengeId: CHALLENGE_ID,
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
    });
    expect(JSON.stringify(body)).not.toMatch(/phone|otp|salt|digest|delivery|pepper|reused/i);
  });

  it('keeps a cooldown replay transport-identical and does not add a delivery concern', async () => {
    let calls = 0;
    const handlers = fakeHandlers({
      requestOtp: {
        execute: () => {
          calls += 1;
          return {
            challengeId: CHALLENGE_ID,
            phoneE164: '+34612345678',
            expiresAt: '2030-01-01T12:04:30.000Z',
            resendAvailableAt: '2030-01-01T12:00:30.000Z',
            reused: true,
          };
        },
      },
    });
    const response = await handlers.requestOtp(jsonRequest('/api/v1/auth/otp/request', {
      phoneE164: '+34612345678',
      locale: 'pt-BR',
    }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      challengeId: CHALLENGE_ID,
      expiresInSeconds: 270,
      resendAfterSeconds: 30,
    });
    expect(calls).toBe(1);
  });

  it.each([
    ['other country', { phoneE164: '+33612345678', locale: 'es-ES' }],
    ['short phone', { phoneE164: '+3461234567', locale: 'es-ES' }],
    ['invalid locale', { phoneE164: '+34612345678', locale: 'fr-FR' }],
    ['missing locale', { phoneE164: '+34612345678' }],
    ['additional field', { phoneE164: '+34612345678', locale: 'es-ES', otp: '123456' }],
    ['array', []],
    ['null', null],
    ['prototype key', '{"phoneE164":"+34612345678","locale":"es-ES","__proto__":{}}'],
  ])('rejects invalid request input: %s', async (_name, body) => {
    const response = await fakeHandlers().requestOtp(
      jsonRequest('/api/v1/auth/otp/request', body),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ correlationId: CORRELATION_ID });
  });

  it('rejects malformed JSON, incompatible content type, oversized bodies and queries', async () => {
    const handlers = fakeHandlers();
    const malformed = await handlers.requestOtp(jsonRequest(
      '/api/v1/auth/otp/request',
      '{',
    ));
    const contentType = await handlers.requestOtp(new Request(
      'http://localhost/api/v1/auth/otp/request',
      { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' },
    ));
    const oversized = await handlers.requestOtp(jsonRequest(
      '/api/v1/auth/otp/request',
      JSON.stringify({ phoneE164: '+34612345678', locale: 'es-ES', pad: 'x'.repeat(16_384) }),
    ));
    const query = await handlers.requestOtp(jsonRequest(
      '/api/v1/auth/otp/request?debug=true',
      { phoneE164: '+34612345678', locale: 'es-ES' },
    ));
    expect([malformed.status, contentType.status, oversized.status, query.status])
      .toEqual([400, 400, 400, 400]);
  });

  it('maps cooldown to 429 with an integer Retry-After', async () => {
    const handlers = fakeHandlers({
      requestOtp: {
        execute: () => {
          throw new CustomerAuthenticationError('OTP_RESEND_COOLDOWN', 42);
        },
      },
    });
    const response = await handlers.requestOtp(jsonRequest('/api/v1/auth/otp/request', {
      phoneE164: '+34612345678',
      locale: 'en-GB',
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('42');
    expect(await response.json()).toMatchObject({ code: 'OTP_RESEND_COOLDOWN' });
  });

  it('maps missing configuration and delivery failures to safe 503 responses', async () => {
    const missing = fakeHandlers({
      requestOtp: {
        execute: () => {
          throw new CustomerAuthenticationError('AUTH_CONFIGURATION_UNAVAILABLE');
        },
      },
    });
    const unavailable = fakeHandlers({
      requestOtp: { execute: () => { throw new Error('provider detail'); } },
    });
    const request = () => jsonRequest('/api/v1/auth/otp/request', {
      phoneE164: '+34612345678',
      locale: 'es-ES',
    });
    const first = await missing.requestOtp(request());
    const second = await unavailable.requestOtp(request());
    expect(first.status).toBe(503);
    expect(second.status).toBe(503);
    expect(JSON.stringify(await first.json())).not.toContain('provider detail');
    expect(await second.json()).toMatchObject({ code: 'OTP_DELIVERY_UNAVAILABLE' });
  });

  it('verifies with only challengeId and code and returns one opaque session', async () => {
    let captured: Record<string, unknown> | undefined;
    const handlers = fakeHandlers({
      verifyOtp: {
        execute: (input) => {
          captured = input;
          return {
            customer: {
              customerId: CUSTOMER_ID,
              phoneE164: '+34612345678',
              phoneVerifiedAt: NOW.toISOString(),
            },
            session: {
              sessionId: '00000000-0000-4000-8000-000000000003',
              token: 'b'.repeat(64),
              expiresAt: '2030-01-31T12:00:00.000Z',
            },
          };
        },
      },
    });
    const response = await handlers.verifyOtp(jsonRequest('/api/v1/auth/otp/verify', {
      challengeId: CHALLENGE_ID,
      code: '123456',
    }));
    expect(response.status).toBe(200);
    expect(captured).toEqual({ challengeId: CHALLENGE_ID, otp: '123456', now: NOW });
    expect(captured).not.toHaveProperty('phone');
    const body = await response.json();
    expect(body).toEqual({
      sessionToken: 'b'.repeat(64),
      expiresInSeconds: 2_592_000,
      customer: {
        id: CUSTOMER_ID,
        phoneE164: '+34612345678',
        phoneVerifiedAt: NOW.toISOString(),
        status: 'ACTIVE',
      },
    });
    expect(body).not.toHaveProperty('sessionId');
    expect(JSON.stringify(body)).not.toMatch(/accessToken|refreshToken|token_hash|salt|pepper/);
  });

  it.each([
    [{ challengeId: 'invalid', code: '123456' }, 400],
    [{ challengeId: CHALLENGE_ID, code: '12345' }, 400],
    [{ challengeId: CHALLENGE_ID, code: '123456', phone: '+34612345678' }, 400],
  ])('rejects invalid verify bodies', async (body, status) => {
    const response = await fakeHandlers().verifyOtp(
      jsonRequest('/api/v1/auth/otp/verify', body),
    );
    expect(response.status).toBe(status);
  });

  it.each([
    ['INVALID_OTP', 400, 'OTP_INVALID'],
    ['OTP_EXPIRED', 400, 'OTP_EXPIRED'],
    ['OTP_UNAVAILABLE', 400, 'OTP_UNAVAILABLE'],
    ['OTP_LOCKED', 429, 'OTP_LOCKED'],
    ['AUTH_CONFIGURATION_UNAVAILABLE', 503, 'AUTH_CONFIGURATION_UNAVAILABLE'],
  ] as const)('maps verify failure %s safely', async (errorCode, status, publicCode) => {
    const response = await fakeHandlers({
      verifyOtp: {
        execute: () => { throw new CustomerAuthenticationError(errorCode); },
      },
    }).verifyOtp(jsonRequest('/api/v1/auth/otp/verify', {
      challengeId: CHALLENGE_ID,
      code: '000000',
    }));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code: publicCode, correlationId: CORRELATION_ID });
  });

  it('integrates request and phone-free verify against one writable SQLite database', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'hielya-auth-http-'));
    directories.push(directory);
    const persistence = new MvpPersistenceDatabase(join(directory, 'auth.sqlite'));
    persistence.migrate();
    persistence.seed({
      minimumProductSubtotalCents: 2500,
      deliveryBaseFeeCents: 200,
      deliveryFeePerKmCents: 60,
      maximumRoadDistanceKm: 4,
      maximumPinAttempts: 3,
      tipsEnabled: true,
    });
    const repository = new SqliteCustomerAuthenticationRepository(persistence);
    const gateway = new RecordingSimulatedSmsGateway();
    let id = 0;
    const crypto = {
      randomBytes: (size: number) => Buffer.alloc(size, id === 0 ? 1 : 2),
      randomId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
      generateOtp: () => '654321',
    };
    const pepper = { getPepper: () => Buffer.from('integration-pepper') };
    const requestUseCase = new RequestCustomerOtp(repository, gateway, pepper, crypto);
    const verifyUseCase = new VerifyCustomerOtp(repository, pepper, crypto);
    const handlers = createAuthHttpHandlers({
      requestOtp: requestUseCase,
      verifyOtp: verifyUseCase,
      correlationIds: { generate: () => CORRELATION_ID },
      clock: { now: () => new Date(NOW) },
    });
    const requested = await handlers.requestOtp(jsonRequest('/api/v1/auth/otp/request', {
      phoneE164: '+34612345678',
      locale: 'es-ES',
    }));
    const challenge = await requested.json() as { challengeId: string };
    expect(gateway.messages).toHaveLength(1);
    expect(gateway.messages[0]?.otp).toBe('654321');
    const verified = await handlers.verifyOtp(jsonRequest('/api/v1/auth/otp/verify', {
      challengeId: challenge.challengeId,
      code: gateway.messages[0]?.otp,
    }));
    expect(verified.status).toBe(200);
    const result = await verified.json() as { sessionToken: string };
    const session = persistence.db.prepare('SELECT token_hash FROM customer_sessions')
      .get<{ token_hash: string }>();
    expect(session?.token_hash).toBe(createHash('sha256').update(result.sessionToken).digest('hex'));
    expect(JSON.stringify(session)).not.toContain(result.sessionToken);
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customers')
      .get<{ count: number }>()?.count).toBe(1);
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM customer_sessions')
      .get<{ count: number }>()?.count).toBe(1);
    persistence.close();
  });

  it('fails closed when runtime configuration is absent or production is active', async () => {
    delete process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH;
    delete process.env.HIELYA_OTP_PEPPER;
    mutableEnvironment.NODE_ENV = 'test';
    const missing = await createRuntimeAuthHandlers().requestOtp(jsonRequest(
      '/api/v1/auth/otp/request',
      { phoneE164: '+34612345678', locale: 'es-ES' },
    ));
    mutableEnvironment.NODE_ENV = 'production';
    process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH = 'never-opened.sqlite';
    process.env.HIELYA_OTP_PEPPER = 'must-not-be-used';
    const production = await createRuntimeAuthHandlers().requestOtp(jsonRequest(
      '/api/v1/auth/otp/request',
      { phoneE164: '+34612345678', locale: 'es-ES' },
    ));
    expect(missing.status).toBe(503);
    expect(production.status).toBe(503);
    expect(await missing.json()).toMatchObject({ code: 'AUTH_CONFIGURATION_UNAVAILABLE' });
    expect(await production.json()).toMatchObject({ code: 'AUTH_CONFIGURATION_UNAVAILABLE' });
  });
});
