import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('MVP Local 36 OpenAPI V1.1 contract Gate', () => {
  it('preserves the canonical baseline and validates the derived public contract', () => {
    const output = execFileSync(process.execPath, ['scripts/validate-mvp-local-36-openapi.mjs'], { encoding: 'utf8' });

    expect(output).toContain('ORIGINAL_ACTUAL_SHA256=a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9');
    expect(output).toContain('YAML_VALIDATION=SUCCESS');
    expect(output).toContain('OPENAPI_VALIDATION=SUCCESS');
    expect(output).toMatch(/LOCAL_REFERENCES=[1-9][0-9]*/);
    expect(output).toContain('OPERATION_IDS=5');
    expect(output).toContain('PARALLEL_ROUTES_FOUND=0');
    expect(output).toContain('PUBLIC_NUMERIC_STOCK_FIELDS=0');
    expect(output).toContain('PUBLIC_INTERNAL_DTO_SEPARATION=true');
    expect(output).toContain('DELIVERY_QUOTE_CONTRACT=SERVER_CALCULATED');
    expect(output).toContain('CART_VALIDATION_STATUS=DEFERRED_AUTH_CART_LAYER');
  });
});
