import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  GetPublicProduct,
  ListPublicCategories,
  ListPublicProducts,
  QuoteSimulatedDelivery,
  type CatalogQueryPort,
  type PublicCategory,
  type PublicProduct,
} from '../../packages/application/src/index';
import { createPublicApiHandlers } from '../../apps/ui-lab/src/server/mvp-local-36/http';

type JsonObject = Record<string, unknown>;
type HttpMethod = 'get' | 'post';

const isObject = (value: unknown): value is JsonObject => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const contract = JSON.parse(readFileSync(resolve(
  process.cwd(),
  'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml',
), 'utf8')) as JsonObject;

const resolveReference = (reference: string): unknown => {
  if (!reference.startsWith('#/')) {
    throw new Error(`Only local OpenAPI references are supported in this test: ${reference}`);
  }
  return reference.slice(2).split('/').reduce<unknown>((current, segment) => {
    if (!isObject(current)) return undefined;
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~');
    return current[key];
  }, contract);
};

const dereference = (value: unknown): JsonObject => {
  if (!isObject(value)) throw new Error('Expected an OpenAPI object.');
  const reference = value.$ref;
  return typeof reference === 'string' ? dereference(resolveReference(reference)) : value;
};

const responseSchema = (path: string, method: HttpMethod, status: number): JsonObject => {
  const paths = dereference(contract.paths);
  const pathItem = dereference(paths[path]);
  const operation = dereference(pathItem[method]);
  const responses = dereference(operation.responses);
  const response = dereference(responses[String(status)]);
  const content = dereference(response.content);
  const mediaType = dereference(content['application/json']);
  return dereference(mediaType.schema);
};

const schemaTypeMatches = (value: unknown, type: string): boolean => {
  switch (type) {
    case 'array': return Array.isArray(value);
    case 'boolean': return typeof value === 'boolean';
    case 'integer': return typeof value === 'number' && Number.isInteger(value);
    case 'null': return value === null;
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'object': return isObject(value);
    case 'string': return typeof value === 'string';
    default: throw new Error(`Unsupported JSON Schema type in contract test: ${type}`);
  }
};

const sameJsonValue = (left: unknown, right: unknown): boolean => (
  JSON.stringify(left) === JSON.stringify(right)
);

const validateSchema = (value: unknown, schemaInput: unknown, path = '$'): string[] => {
  const schema = dereference(schemaInput);
  const errors: string[] = [];

  if ('const' in schema && !sameJsonValue(value, schema.const)) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => sameJsonValue(value, item))) {
    errors.push(`${path} is not in the allowed enum`);
  }

  const declaredTypes = typeof schema.type === 'string'
    ? [schema.type]
    : Array.isArray(schema.type)
      ? schema.type.filter((item): item is string => typeof item === 'string')
      : [];
  if (declaredTypes.length > 0 && !declaredTypes.some((type) => schemaTypeMatches(value, type))) {
    errors.push(`${path} must have type ${declaredTypes.join('|')}`);
    return errors;
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path} must be >= ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${path} must be <= ${schema.maximum}`);
    }
  }

  if (typeof value === 'string' && typeof schema.format === 'string') {
    if (schema.format === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      errors.push(`${path} must be a UUID`);
    }
    if (schema.format === 'uri') {
      try {
        new URL(value);
      } catch {
        errors.push(`${path} must be a URI`);
      }
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${path} must have at least ${schema.minItems} items`);
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) => {
        errors.push(...validateSchema(item, schema.items, `${path}[${index}]`));
      });
    }
  }

  if (isObject(value)) {
    const properties = isObject(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required)
      ? schema.required.filter((item): item is string => typeof item === 'string')
      : [];
    for (const key of required) {
      if (!(key in value)) errors.push(`${path}.${key} is required`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (key in properties) {
        errors.push(...validateSchema(child, properties[key], `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key} is an additional property`);
      } else if (isObject(schema.additionalProperties)) {
        errors.push(...validateSchema(child, schema.additionalProperties, `${path}.${key}`));
      }
    }
  }

  if (Array.isArray(schema.allOf)) {
    for (const member of schema.allOf) {
      errors.push(...validateSchema(value, member, path));
    }
  }
  if (schema.if !== undefined && validateSchema(value, schema.if, path).length === 0 && schema.then !== undefined) {
    errors.push(...validateSchema(value, schema.then, path));
  }

  return errors;
};

const category: PublicCategory = {
  id: '11111111-1111-5111-8111-111111111111',
  slug: 'cervezas',
  name: 'Cervezas',
  sortOrder: 1,
};

const unitProduct: PublicProduct = {
  id: '22222222-2222-5222-8222-222222222222',
  sku: 'TST-CER-001',
  name: 'Cerveza de prueba',
  categoryId: category.id,
  salePriceCents: 149,
  currency: 'EUR',
  availability: 'AVAILABLE',
  isPack: false,
  iceIncluded: false,
  maxPerOrder: 12,
  containsAlcohol: true,
  minimumAge: 18,
  bundleComponents: [],
};

const packProduct: PublicProduct = {
  id: '33333333-3333-5333-8333-333333333333',
  sku: 'TST-CMB-001',
  name: 'Pack de prueba con hielo',
  categoryId: category.id,
  salePriceCents: 1200,
  currency: 'EUR',
  availability: 'TEMPORARILY_UNAVAILABLE',
  isPack: true,
  iceIncluded: true,
  maxPerOrder: 2,
  containsAlcohol: true,
  minimumAge: 18,
  bundleComponents: [{
    productId: unitProduct.id,
    sku: unitProduct.sku,
    name: unitProduct.name,
    quantity: 6,
  }],
};

const products = [unitProduct, packProduct] as const;

const catalog: CatalogQueryPort = {
  listPublicCategories: () => [category],
  listPublicProducts: () => products,
  findPublicProductById: (productId) => products.find((product) => product.id === productId),
};

const handlers = createPublicApiHandlers({
  listCategories: new ListPublicCategories(catalog),
  listProducts: new ListPublicProducts(catalog),
  getProduct: new GetPublicProduct(catalog),
  quoteDelivery: new QuoteSimulatedDelivery(
    {
      getDeliverySettings: () => ({
        deliveryBaseFeeCents: 200,
        deliveryFeePerKmCents: 60,
        maximumRoadDistanceKm: 4,
      }),
    },
    { getRoadDistanceKm: () => 2.5 },
  ),
  correlationIds: { generate: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
});

const bodyOf = (response: Response): Promise<unknown> => response.json() as Promise<unknown>;

const internalFieldPattern = /stock|reserv|movement|cost|margin|batch|reorder|remaining|onHand|availableQuantity|physicalQuantity|bundleAvailability/i;

const findInternalFields = (value: unknown, path = '$'): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findInternalFields(item, `${path}[${index}]`));
  }
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(internalFieldPattern.test(key) ? [`${path}.${key}`] : []),
    ...findInternalFields(child, `${path}.${key}`),
  ]);
};

describe('MVP Local 36 OpenAPI response conformance', () => {
  it('validates all four successful handler responses against their contracted schemas', async () => {
    const categories = await handlers.listCategories(new Request('http://localhost/api/v1/catalog/categories'));
    const productPage = await handlers.listProducts(new Request('http://localhost/api/v1/catalog/products?page=1&pageSize=20'));
    const detail = await handlers.getProduct(
      new Request(`http://localhost/api/v1/catalog/products/${packProduct.id}`),
      packProduct.id,
    );
    const quote = await handlers.quoteDelivery(new Request('http://localhost/api/v1/delivery/quote', {
      method: 'POST',
      body: JSON.stringify({ latitude: 36.54, longitude: -4.62, addressType: 'HOME' }),
    }));

    const successfulResponses = [
      [categories, responseSchema('/catalog/categories', 'get', 200)],
      [productPage, responseSchema('/catalog/products', 'get', 200)],
      [detail, responseSchema('/catalog/products/{productId}', 'get', 200)],
      [quote, responseSchema('/delivery/quote', 'post', 200)],
    ] as const;

    for (const [response, schema] of successfulResponses) {
      expect(response.status).toBe(200);
      const body = await bodyOf(response);
      expect(validateSchema(body, schema)).toEqual([]);
      expect(findInternalFields(body)).toEqual([]);
    }
  });

  it('validates PublicError responses for contracted 400 and 404 outcomes', async () => {
    const badRequest = await handlers.listProducts(new Request(
      'http://localhost/api/v1/catalog/products?page=0',
    ));
    const notFound = await handlers.getProduct(
      new Request('http://localhost/api/v1/catalog/products/44444444-4444-5444-8444-444444444444'),
      '44444444-4444-5444-8444-444444444444',
    );

    expect(badRequest.status).toBe(400);
    expect(validateSchema(
      await bodyOf(badRequest),
      responseSchema('/catalog/products', 'get', 400),
    )).toEqual([]);
    expect(notFound.status).toBe(404);
    expect(validateSchema(
      await bodyOf(notFound),
      responseSchema('/catalog/products/{productId}', 'get', 404),
    )).toEqual([]);
  });

  it('enforces additionalProperties false recursively at every public boundary', async () => {
    const categoryBody = await bodyOf(await handlers.listCategories(
      new Request('http://localhost/api/v1/catalog/categories'),
    ));
    const pageBody = await bodyOf(await handlers.listProducts(
      new Request('http://localhost/api/v1/catalog/products'),
    ));
    const detailBody = await bodyOf(await handlers.getProduct(
      new Request(`http://localhost/api/v1/catalog/products/${packProduct.id}`),
      packProduct.id,
    ));
    const quoteBody = await bodyOf(await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      { method: 'POST', body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }) },
    )));
    const errorBody = await bodyOf(await handlers.listProducts(
      new Request('http://localhost/api/v1/catalog/products?page=0'),
    ));

    const invalidCategory = structuredClone(categoryBody) as JsonObject[];
    invalidCategory[0].physicalStock = 10;
    const invalidPage = structuredClone(pageBody) as JsonObject;
    invalidPage.reservedStock = 3;
    const invalidProduct = structuredClone(detailBody) as JsonObject;
    invalidProduct.purchaseCost = 100;
    const components = invalidProduct.bundleComponents as JsonObject[];
    components[0].inventoryBatch = 'private';
    const invalidQuote = { ...(quoteBody as JsonObject), margin: 1 };
    const invalidError = { ...(errorBody as JsonObject), stack: 'private' };

    expect(validateSchema(invalidCategory, responseSchema('/catalog/categories', 'get', 200)).join('\n')).toMatch(/physicalStock.*additional property/);
    expect(validateSchema(invalidPage, responseSchema('/catalog/products', 'get', 200)).join('\n')).toMatch(/reservedStock.*additional property/);
    const productErrors = validateSchema(invalidProduct, responseSchema('/catalog/products/{productId}', 'get', 200)).join('\n');
    expect(productErrors).toMatch(/purchaseCost.*additional property/);
    expect(productErrors).toMatch(/inventoryBatch.*additional property/);
    expect(validateSchema(invalidQuote, responseSchema('/delivery/quote', 'post', 200)).join('\n')).toMatch(/margin.*additional property/);
    expect(validateSchema(invalidError, responseSchema('/catalog/products', 'get', 400)).join('\n')).toMatch(/stack.*additional property/);
  });

  it('enforces required fields, types, UUIDs, enums, pagination and bundle composition', () => {
    const productSchema = responseSchema('/catalog/products/{productId}', 'get', 200);
    const pageSchema = responseSchema('/catalog/products', 'get', 200);

    const invalidProduct = structuredClone(packProduct) as unknown as JsonObject;
    delete invalidProduct.sku;
    invalidProduct.id = 'not-a-uuid';
    invalidProduct.availability = 'INTERNAL_ONLY';
    invalidProduct.salePriceCents = 12.5;
    invalidProduct.iceIncluded = false;
    const invalidComponents = invalidProduct.bundleComponents as JsonObject[];
    invalidComponents[0].productId = 'not-a-uuid';
    invalidComponents[0].quantity = 0;

    const productErrors = validateSchema(invalidProduct, productSchema).join('\n');
    expect(productErrors).toMatch(/sku is required/);
    expect(productErrors).toMatch(/id must be a UUID/);
    expect(productErrors).toMatch(/availability is not in the allowed enum/);
    expect(productErrors).toMatch(/salePriceCents must have type integer/);
    expect(productErrors).toMatch(/iceIncluded must equal true/);
    expect(productErrors).toMatch(/productId must be a UUID/);
    expect(productErrors).toMatch(/quantity must be >= 1/);

    const emptyPack = { ...packProduct, bundleComponents: [] };
    expect(validateSchema(emptyPack, productSchema).join('\n')).toMatch(/bundleComponents must have at least 1 items/);

    const invalidPage = { items: [unitProduct], page: 0, pageSize: '20', total: -1 };
    const pageErrors = validateSchema(invalidPage, pageSchema).join('\n');
    expect(pageErrors).toMatch(/page must be >= 1/);
    expect(pageErrors).toMatch(/pageSize must have type integer/);
    expect(pageErrors).toMatch(/total must be >= 0/);
  });
});
