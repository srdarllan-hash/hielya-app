import { readFileSync } from 'node:fs';

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CatalogClientError,
  type MvpCatalogClient,
  type MvpProductDetailClient,
} from '../../apps/ui-lab/src/client/mvp-local-36/catalog-client';
import type {
  CatalogResponse,
  PublicProductDto,
  PublicProductPageDto,
} from '../../apps/ui-lab/src/client/mvp-local-36/catalog-contracts';
import { HomeCatalogRuntime } from '../../apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime';
import {
  ProductDetailRuntime,
  createProductDetailRuntimeMachine,
} from '../../apps/ui-lab/src/client/mvp-local-36/ProductDetailRuntime';

const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const SECOND_PRODUCT_ID = '33333333-3333-4333-8333-333333333333';
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const CORRELATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const product: PublicProductDto = {
  id: PRODUCT_ID,
  sku: 'SYN-UNIT-001',
  name: 'Producto sintético',
  categoryId: CATEGORY_ID,
  salePriceCents: 250,
  currency: 'EUR',
  availability: 'AVAILABLE',
  isPack: false,
  iceIncluded: false,
  maxPerOrder: 2,
  containsAlcohol: false,
};

const response = <T,>(data: T): CatalogResponse<T> => ({
  data,
  correlationId: CORRELATION_ID,
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

afterEach(cleanup);

describe('product-detail runtime state machine', () => {
  it('moves from loading to an explicitly mapped READY state', async () => {
    const request = deferred<CatalogResponse<PublicProductDto>>();
    const client: MvpProductDetailClient = {
      getProduct: vi.fn(() => request.promise),
    };
    const machine = createProductDetailRuntimeMachine(client);
    const load = machine.load(PRODUCT_ID);

    expect(machine.getSnapshot()).toEqual({ state: 'PRODUCT_DETAIL_LOADING' });
    expect(client.getProduct).toHaveBeenCalledWith(
      PRODUCT_ID,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    request.resolve(response(product));
    await load;
    expect(machine.getSnapshot()).toMatchObject({
      state: 'PRODUCT_DETAIL_READY',
      product: {
        id: PRODUCT_ID,
        name: 'Producto sintético',
        price: '2,50 €',
      },
    });
  });

  it('maps every 404 to the same safe NOT_FOUND state', async () => {
    const client: MvpProductDetailClient = {
      getProduct: vi.fn(async () => {
        throw new CatalogClientError('HTTP_ERROR', 'Internal product exists', {
          status: 404,
          correlationId: CORRELATION_ID,
        });
      }),
    };
    const machine = createProductDetailRuntimeMachine(client);

    await machine.load(PRODUCT_ID);

    expect(machine.getSnapshot()).toEqual({ state: 'PRODUCT_DETAIL_NOT_FOUND' });
    expect(JSON.stringify(machine.getSnapshot())).not.toMatch(/internal|exists/i);
  });

  it('maps network, timeout and invalid payload errors to a data-free ERROR state', async () => {
    const client: MvpProductDetailClient = {
      getProduct: vi.fn(async () => {
        throw new Error('SQL /srv/private inventory');
      }),
    };
    const machine = createProductDetailRuntimeMachine(client);

    await machine.load(PRODUCT_ID);

    expect(machine.getSnapshot()).toEqual({ state: 'PRODUCT_DETAIL_ERROR' });
    expect(JSON.stringify(machine.getSnapshot())).not.toMatch(/SQL|srv|inventory/i);
  });

  it('aborts the previous request and ignores a late response', async () => {
    const oldRequest = deferred<CatalogResponse<PublicProductDto>>();
    const currentRequest = deferred<CatalogResponse<PublicProductDto>>();
    const client: MvpProductDetailClient = {
      getProduct: vi.fn()
        .mockImplementationOnce(() => oldRequest.promise)
        .mockImplementationOnce(() => currentRequest.promise),
    };
    const machine = createProductDetailRuntimeMachine(client);

    const oldLoad = machine.load(PRODUCT_ID);
    const oldSignal = vi.mocked(client.getProduct).mock.calls[0]?.[1]?.signal;
    const currentLoad = machine.load(SECOND_PRODUCT_ID);
    expect(oldSignal?.aborted).toBe(true);

    currentRequest.resolve(response({
      ...product,
      id: SECOND_PRODUCT_ID,
      name: 'Resultado actual',
    }));
    await currentLoad;
    oldRequest.resolve(response({ ...product, name: 'Resultado antiguo' }));
    await oldLoad;

    expect(machine.getSnapshot()).toMatchObject({
      state: 'PRODUCT_DETAIL_READY',
      product: { id: SECOND_PRODUCT_ID, name: 'Resultado actual' },
    });
  });
});

describe('product-detail UI runtime wiring', () => {
  it('renders canonical 404 as NOT_FOUND and hides the public error payload', async () => {
    const client: MvpProductDetailClient = {
      getProduct: vi.fn(async () => {
        throw new CatalogClientError('HTTP_ERROR', 'Canonical product paused', {
          status: 404,
          publicError: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Canonical product paused',
            correlationId: CORRELATION_ID,
          },
        });
      }),
    };

    render(<ProductDetailRuntime productId={PRODUCT_ID} client={client} />);

    expect(await screen.findByRole('heading', { name: 'Producto no encontrado' }))
      .toBeInTheDocument();
    expect(document.querySelector('[data-product-detail-state="PRODUCT_DETAIL_NOT_FOUND"]'))
      .toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/canonical product paused/i);
  });

  it('renders a safe error and retries through the same read-only client', async () => {
    const getProduct = vi.fn()
      .mockRejectedValueOnce(new Error('SQL /private/inventory'))
      .mockResolvedValueOnce(response(product));
    const client: MvpProductDetailClient = { getProduct };

    render(<ProductDetailRuntime productId={PRODUCT_ID} client={client} />);

    expect(await screen.findByText('No pudimos cargar el producto. Inténtalo de nuevo.'))
      .toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/SQL|private|inventory/i);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Producto sintético' }))
      .toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledTimes(2);
  });

  it('connects a Home card to the controlled canonical detail route', async () => {
    const packProduct: PublicProductDto = {
      ...product,
      id: SECOND_PRODUCT_ID,
      sku: 'SYN-PACK-001',
      name: 'Pack sintético',
      isPack: true,
      iceIncluded: true,
      bundleComponents: [{
        productId: PRODUCT_ID,
        sku: product.sku,
        name: product.name,
        quantity: 2,
      }],
    };
    const page: PublicProductPageDto = {
      items: [product, packProduct],
      page: 1,
      pageSize: 20,
      total: 2,
    };
    const client: MvpCatalogClient = {
      listCategories: vi.fn(async () => response([])),
      listProducts: vi.fn(async () => response(page)),
    };
    const onOpenProduct = vi.fn();

    render(
      <HomeCatalogRuntime
        client={client}
        onOpenProduct={onOpenProduct}
      />,
    );
    await screen.findByText('Producto sintético');
    const detailTrigger = screen.getByRole('button', {
      name: 'Ver detalles de Producto sintético',
    });
    expect(detailTrigger.closest('h3')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Producto sintético' })).toBeInTheDocument();
    detailTrigger.focus();
    expect(detailTrigger).toHaveFocus();
    await act(async () => {
      fireEvent.click(detailTrigger);
    });

    expect(onOpenProduct).toHaveBeenCalledWith(PRODUCT_ID);

    const packTrigger = screen.getByRole('button', {
      name: 'Ver detalles de Pack sintético',
    });
    expect(packTrigger.closest('h3')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Pack sintético' })).toBeInTheDocument();
    packTrigger.focus();
    expect(packTrigger).toHaveFocus();
    fireEvent.click(packTrigger);
    expect(onOpenProduct).toHaveBeenLastCalledWith(SECOND_PRODUCT_ID);
  });

  it('uses a deterministic Home fallback instead of browser history', () => {
    const source = readFileSync(
      'apps/ui-lab/src/client/mvp-local-36/ProductDetailRuntime.tsx',
      'utf8',
    );

    expect(source).toContain("globalThis.location.assign('/')");
    expect(source).not.toMatch(/history\.back|history\.go/);
  });
});
