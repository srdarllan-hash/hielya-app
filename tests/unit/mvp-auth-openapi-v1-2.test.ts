import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const contractPath = join(
  process.cwd(),
  'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml',
);
const source = readFileSync(contractPath, 'utf8');
const contract = JSON.parse(source) as {
  openapi: string;
  jsonSchemaDialect: string;
  info: { version: string };
  servers: Array<{ url: string }>;
  paths: Record<string, Record<string, {
    operationId?: string;
    requestBody?: { content?: { 'application/json'?: { schema?: { $ref?: string } } } };
  }>>;
  components: {
    securitySchemes: Record<string, Record<string, unknown>>;
    schemas: Record<string, Record<string, unknown>>;
  };
  'x-hielya-lineage': Array<{
    file: string;
    sha256: string;
    modified: boolean;
  }>;
};

const hash = (path: string): string => createHash('sha256')
  .update(readFileSync(join(process.cwd(), path)))
  .digest('hex');

const localReferences = (value: unknown, references: string[] = []): string[] => {
  if (Array.isArray(value)) {
    for (const item of value) localReferences(item, references);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && typeof child === 'string') references.push(child);
      else localReferences(child, references);
    }
  }
  return references;
};

const resolveReference = (reference: string): unknown => {
  expect(reference.startsWith('#/')).toBe(true);
  return reference.slice(2).split('/').reduce<unknown>((value, segment) => (
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)[segment.replace(/~1/g, '/').replace(/~0/g, '~')]
      : undefined
  ), contract);
};

describe('MVP Local 36 OpenAPI V1.2 opaque authentication contract', () => {
  it('preserves the frozen V1.0 and V1.1 byte hashes and records lineage', () => {
    const expected = {
      'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml':
        'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9',
      'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml':
        '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8',
    };
    for (const [file, digest] of Object.entries(expected)) expect(hash(file)).toBe(digest);
    expect(contract['x-hielya-lineage']).toEqual([
      expect.objectContaining({
        file: 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml',
        sha256: expected['contracts/openapi/HIELYA_OPENAPI_V1_0.yaml'],
        modified: false,
      }),
      expect.objectContaining({
        file: 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml',
        sha256: expected['contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml'],
        modified: false,
      }),
    ]);
  });

  it('is OpenAPI 3.1.1 with JSON Schema 2020-12 and valid local references', () => {
    expect(contract.openapi).toBe('3.1.1');
    expect(contract.jsonSchemaDialect).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(contract.info.version).toBe('1.2.0');
    expect(contract.servers).toEqual([
      expect.objectContaining({ url: '/api/v1' }),
    ]);
    for (const reference of localReferences(contract)) {
      expect(resolveReference(reference), reference).toBeDefined();
    }
  });

  it('adds exactly two auth operations and preserves unique operationIds', () => {
    const v11 = JSON.parse(readFileSync(
      join(process.cwd(), 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml'),
      'utf8',
    )) as { paths: Record<string, unknown> };
    const added = Object.keys(contract.paths).filter((path) => !(path in v11.paths));
    expect(added.sort()).toEqual(['/auth/otp/request', '/auth/otp/verify']);
    const operationIds = Object.values(contract.paths).flatMap((path) => (
      Object.values(path).flatMap((operation) => operation.operationId ? [operation.operationId] : [])
    ));
    expect(new Set(operationIds).size).toBe(operationIds.length);
    expect(operationIds).toContain('requestCustomerOtp');
    expect(operationIds).toContain('verifyCustomerOtp');
    expect(contract.paths['/carts/{cartId}/validate']).toMatchObject({
      post: { 'x-hielya-implementation-status': 'DEFERRED_AUTH_CART_LAYER' },
    });
  });

  it('defines strict request, challenge, customer and opaque-session schemas', () => {
    expect(contract.components.schemas.OtpRequest).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['phoneE164', 'locale'],
      properties: {
        phoneE164: { type: 'string', pattern: '^\\+34[0-9]{9}$' },
        locale: { type: 'string', enum: ['es-ES', 'en-GB', 'pt-BR'] },
      },
    });
    expect(contract.components.schemas.OtpVerify).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['challengeId', 'code'],
      properties: {
        challengeId: { type: 'string', format: 'uuid' },
        code: { type: 'string', pattern: '^[0-9]{6}$' },
      },
    });
    expect(contract.components.schemas.OtpVerify).not.toHaveProperty('properties.phone');
    expect(contract.components.schemas.OpaqueSessionAuthentication).toMatchObject({
      type: 'object',
      additionalProperties: false,
      required: ['sessionToken', 'expiresInSeconds', 'customer'],
    });
    expect(contract.components.securitySchemes.customerBearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'OpaqueSessionToken',
    });
  });

  it('contains no historical token-pair or renewal contract', () => {
    for (const forbidden of [
      'TokenPair',
      'accessToken',
      'refreshToken',
      'bearerFormat": "JWT',
      '/auth/refresh',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
