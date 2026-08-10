import type {
  CorrelationIdPort,
  OtpChallengeResult,
  OtpVerificationResult,
} from '@hielya/application';
import { CustomerAuthenticationError } from '@hielya/application';

const MAX_JSON_BODY_BYTES = 16_384;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^\+34[0-9]{9}$/;
const OTP_PATTERN = /^[0-9]{6}$/;
const LOCALES = new Set(['es-ES', 'en-GB', 'pt-BR']);

type AuthErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_PHONE'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_UNAVAILABLE'
  | 'OTP_LOCKED'
  | 'OTP_RESEND_COOLDOWN'
  | 'AUTH_CONFIGURATION_UNAVAILABLE'
  | 'OTP_DELIVERY_UNAVAILABLE';

interface RequestOtpService {
  execute(phone: string, now?: Date | string): OtpChallengeResult | Promise<OtpChallengeResult>;
}

interface VerifyOtpService {
  execute(input: {
    challengeId: string;
    otp: string;
    now?: Date | string;
  }): OtpVerificationResult | Promise<OtpVerificationResult>;
}

export interface AuthClockPort {
  now(): Date;
}

export interface AuthHttpHandlerDependencies {
  requestOtp: RequestOtpService;
  verifyOtp: VerifyOtpService;
  correlationIds: CorrelationIdPort;
  clock: AuthClockPort;
}

export interface AuthHttpHandlers {
  requestOtp(request: Request): Promise<Response>;
  verifyOtp(request: Request): Promise<Response>;
}

class AuthHttpInputError extends Error {
  constructor(
    readonly code: 'INVALID_INPUT' | 'INVALID_PHONE',
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'AuthHttpInputError';
  }
}

const authHeaders = (
  correlationId: string,
  retryAfterSeconds?: number,
): Record<string, string> => ({
  'cache-control': 'no-store',
  pragma: 'no-cache',
  'x-correlation-id': correlationId,
  ...(retryAfterSeconds === undefined
    ? {}
    : { 'retry-after': String(Math.max(0, Math.ceil(retryAfterSeconds))) }),
});

const jsonResponse = (
  body: unknown,
  status: number,
  correlationId: string,
  retryAfterSeconds?: number,
): Response => Response.json(body, {
  status,
  headers: authHeaders(correlationId, retryAfterSeconds),
});

const requestCorrelationId = (request: Request, generator: CorrelationIdPort): string => {
  const supplied = request.headers.get('x-correlation-id');
  return supplied && UUID_PATTERN.test(supplied) ? supplied : generator.generate();
};

const rejectQueryParameters = (request: Request): void => {
  if ([...new URL(request.url).searchParams.keys()].length > 0) {
    throw new AuthHttpInputError(
      'INVALID_INPUT',
      'Authentication endpoints do not accept query parameters.',
    );
  }
};

const hasCompatibleJsonContentType = (request: Request): boolean => {
  const contentType = request.headers.get('content-type');
  if (!contentType) return false;
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType === 'application/json'
    || Boolean(mediaType?.startsWith('application/') && mediaType.endsWith('+json'));
};

const parseJsonObject = async (request: Request): Promise<Record<string, unknown>> => {
  if (!hasCompatibleJsonContentType(request)) {
    throw new AuthHttpInputError(
      'INVALID_INPUT',
      'The Content-Type must be compatible with application/json.',
    );
  }
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_JSON_BODY_BYTES)) {
    throw new AuthHttpInputError('INVALID_INPUT', 'The request body is too large.');
  }
  const source = await request.text();
  if (
    source.length === 0
    || new TextEncoder().encode(source).byteLength > MAX_JSON_BODY_BYTES
  ) {
    throw new AuthHttpInputError(
      'INVALID_INPUT',
      source.length === 0 ? 'The request body is required.' : 'The request body is too large.',
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new AuthHttpInputError('INVALID_INPUT', 'The request body must be valid JSON.');
  }
  if (
    value === null
    || typeof value !== 'object'
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new AuthHttpInputError('INVALID_INPUT', 'The request body must be a JSON object.');
  }
  return value as Record<string, unknown>;
};

const strictFields = (
  input: Record<string, unknown>,
  required: readonly string[],
): void => {
  const allowed = new Set(required);
  const unsupported = Object.keys(input).find((field) => !allowed.has(field));
  if (unsupported) {
    throw new AuthHttpInputError(
      'INVALID_INPUT',
      'The request contains an unsupported field.',
      unsupported,
    );
  }
  const missing = required.find((field) => !Object.prototype.hasOwnProperty.call(input, field));
  if (missing) {
    throw new AuthHttpInputError('INVALID_INPUT', 'A required field is missing.', missing);
  }
};

const parseOtpRequest = async (request: Request): Promise<{
  phoneE164: string;
  locale: 'es-ES' | 'en-GB' | 'pt-BR';
}> => {
  const input = await parseJsonObject(request);
  strictFields(input, ['phoneE164', 'locale']);
  if (typeof input.phoneE164 !== 'string' || !PHONE_PATTERN.test(input.phoneE164)) {
    throw new AuthHttpInputError('INVALID_PHONE', 'The phone number is invalid.', 'phoneE164');
  }
  if (typeof input.locale !== 'string' || !LOCALES.has(input.locale)) {
    throw new AuthHttpInputError('INVALID_INPUT', 'The locale is invalid.', 'locale');
  }
  return {
    phoneE164: input.phoneE164,
    locale: input.locale as 'es-ES' | 'en-GB' | 'pt-BR',
  };
};

const parseOtpVerify = async (request: Request): Promise<{
  challengeId: string;
  code: string;
}> => {
  const input = await parseJsonObject(request);
  strictFields(input, ['challengeId', 'code']);
  if (typeof input.challengeId !== 'string' || !UUID_PATTERN.test(input.challengeId)) {
    throw new AuthHttpInputError('INVALID_INPUT', 'The challengeId is invalid.', 'challengeId');
  }
  if (typeof input.code !== 'string' || !OTP_PATTERN.test(input.code)) {
    throw new AuthHttpInputError('INVALID_INPUT', 'The code is invalid.', 'code');
  }
  return { challengeId: input.challengeId, code: input.code };
};

const secondsUntil = (timestamp: string, now: Date, minimum = 0): number => {
  const milliseconds = new Date(timestamp).getTime() - now.getTime();
  if (!Number.isFinite(milliseconds)) return minimum;
  return Math.max(minimum, Math.ceil(milliseconds / 1_000));
};

const errorResponse = (
  error: unknown,
  operation: 'request' | 'verify',
  correlationId: string,
): Response => {
  let code: AuthErrorCode;
  let status: 400 | 429 | 503;
  let field: string | undefined;
  let retryAfterSeconds: number | undefined;

  if (error instanceof AuthHttpInputError) {
    code = error.code;
    status = 400;
    field = error.field;
  } else if (error instanceof CustomerAuthenticationError) {
    retryAfterSeconds = error.retryAfterSeconds;
    switch (error.code) {
      case 'INVALID_PHONE':
        code = 'INVALID_PHONE'; status = 400; field = 'phoneE164'; break;
      case 'INVALID_OTP':
        code = 'OTP_INVALID'; status = 400; field = 'code'; break;
      case 'OTP_EXPIRED':
        code = 'OTP_EXPIRED'; status = 400; break;
      case 'OTP_LOCKED':
        code = 'OTP_LOCKED'; status = 429; break;
      case 'OTP_RESEND_COOLDOWN':
        code = 'OTP_RESEND_COOLDOWN'; status = 429; break;
      case 'OTP_UNAVAILABLE':
        code = operation === 'request' ? 'OTP_DELIVERY_UNAVAILABLE' : 'OTP_UNAVAILABLE';
        status = operation === 'request' ? 503 : 400;
        break;
      default:
        code = 'AUTH_CONFIGURATION_UNAVAILABLE'; status = 503;
    }
  } else {
    code = operation === 'request'
      ? 'OTP_DELIVERY_UNAVAILABLE'
      : 'AUTH_CONFIGURATION_UNAVAILABLE';
    status = 503;
  }

  const messages: Record<AuthErrorCode, string> = {
    INVALID_INPUT: 'The authentication request is invalid.',
    INVALID_PHONE: 'The phone number is invalid.',
    OTP_INVALID: 'The verification code is invalid.',
    OTP_EXPIRED: 'The verification challenge has expired.',
    OTP_UNAVAILABLE: 'The verification challenge is unavailable.',
    OTP_LOCKED: 'The verification challenge is locked.',
    OTP_RESEND_COOLDOWN: 'A new verification code cannot be requested yet.',
    AUTH_CONFIGURATION_UNAVAILABLE: 'Authentication is temporarily unavailable.',
    OTP_DELIVERY_UNAVAILABLE: 'OTP delivery is temporarily unavailable.',
  };
  return jsonResponse(
    {
      code,
      message: messages[code],
      correlationId,
      ...(field ? { field } : {}),
    },
    status,
    correlationId,
    status === 429 ? retryAfterSeconds : undefined,
  );
};

export const createAuthHttpHandlers = (
  dependencies: AuthHttpHandlerDependencies,
): AuthHttpHandlers => ({
  async requestOtp(request) {
    const correlationId = requestCorrelationId(request, dependencies.correlationIds);
    try {
      rejectQueryParameters(request);
      const input = await parseOtpRequest(request);
      const now = dependencies.clock.now();
      const challenge = await dependencies.requestOtp.execute(input.phoneE164, now);
      return jsonResponse({
        challengeId: challenge.challengeId,
        expiresInSeconds: secondsUntil(challenge.expiresAt, now),
        resendAfterSeconds: secondsUntil(challenge.resendAvailableAt, now),
      }, 202, correlationId);
    } catch (error) {
      return errorResponse(error, 'request', correlationId);
    }
  },

  async verifyOtp(request) {
    const correlationId = requestCorrelationId(request, dependencies.correlationIds);
    try {
      rejectQueryParameters(request);
      const input = await parseOtpVerify(request);
      const now = dependencies.clock.now();
      const verified = await dependencies.verifyOtp.execute({
        challengeId: input.challengeId,
        otp: input.code,
        now,
      });
      return jsonResponse({
        sessionToken: verified.session.token,
        expiresInSeconds: secondsUntil(verified.session.expiresAt, now, 1),
        customer: {
          id: verified.customer.customerId,
          phoneE164: verified.customer.phoneE164,
          phoneVerifiedAt: verified.customer.phoneVerifiedAt,
          status: 'ACTIVE',
        },
      }, 200, correlationId);
    } catch (error) {
      return errorResponse(error, 'verify', correlationId);
    }
  },
});
