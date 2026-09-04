import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CatalogClientError,
  type MvpCatalogClient,
} from '../../apps/ui-lab/src/client/mvp-local-36/catalog-client';
import type {
  CatalogResponse,
  PublicCategoryDto,
  PublicProductDto,
  PublicProductPageDto,
} from '../../apps/ui-lab/src/client/mvp-local-36/catalog-contracts';
import {
  HomeCatalogRuntime,
  createHomeCatalogRuntimeMachine,
} from '../../apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const UNIT_ID = '22222222-2222-4222-8222-222222222222';
const PACK_ID = '33333333-3333-4333-8333-333333333333';
const COMPONENT_ID = '44444444-4444-4444-8444-444444444444';
const CORRELATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const category: PublicCategoryDto = {
  id: CATEGORY_ID,
  slug: 'synthetic-drinks',
  name: 'Bebidas sintéticas',
  sortOrder: 1,
};

const unitProduct: PublicProductDto = {
  id: UNIT_ID,
  sku: 'SYN-UNIT-001',
  name: 'Agua sintética',
  categoryId: CATEGORY_ID,
  salePriceCents: 250,
  currency: 'EUR',
  availability: 'AVAILABLE',
  isPack: false,
  iceIncluded: false,
  maxPerOrder: 3,
  containsAlcohol: false,
};

const packProduct: PublicProductDto = {
  id: PACK_ID,
  sku: 'SYN-PACK-001',
  name: 'Pack sintético con hielo',
  categoryId: CATEGORY_ID,
  salePriceCents: 1250,
  currency: 'EUR',
  availability: 'TEMPORARILY_UNAVAILABLE',
  isPack: true,
  iceIncluded: true,
  maxPerOrder: 1,
  containsAlcohol: true,
  minimumAge: 18,
  bundleComponents: [{
    productId: COMPONENT_ID,
    sku: 'SYN-COMPONENT-001',
    name: 'Componente sintético',
    quantity: 2,
  }],
};

const page = (
  items: readonly PublicProductDto[],
  total = items.length,
): PublicProductPageDto => ({ items, page: 1, pageSize: 20, total });

const response = <T,>(data: T): CatalogResponse<T> => ({
  data,
  correlationId: CORRELATION_ID,
});

const createClient = (
  products: PublicProductPageDto = page([]),
): MvpCatalogClient => ({
  listCategories: vi.fn(async () => response([category])),
  listProducts: vi.fn(async () => response(products)),
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

describe('Home catalog runtime state machine', () => {
  it('starts category and first-page product requests concurrently', async () => {
    const categoriesRequest = deferred<CatalogResponse<readonly PublicCategoryDto[]>>();
    const productsRequest = deferred<CatalogResponse<PublicProductPageDto>>();
    const client: MvpCatalogClient = {
      listCategories: vi.fn(() => categoriesRequest.promise),
      listProducts: vi.fn(() => productsRequest.promise),
    };
    const machine = createHomeCatalogRuntimeMachine(client);
    const loading = machine.loadInitial();

    expect(client.listCategories).toHaveBeenCalledTimes(1);
    expect(client.listProducts).toHaveBeenCalledWith(
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(machine.getSnapshot().catalogState).toBe('HOME_CATALOG_LOADING');

    categoriesRequest.resolve(response([category]));
    productsRequest.resolve(response(page([unitProduct])));
    await loading;

    expect(machine.getSnapshot().catalogState).toBe('HOME_CATALOG_READY');
  });

  it('maps the canonical empty response to HOME_CATALOG_EMPTY without fallback data', async () => {
    const machine = createHomeCatalogRuntimeMachine(createClient(page([])));

    await machine.loadInitial();

    expect(machine.getSnapshot()).toMatchObject({
      catalogState: 'HOME_CATALOG_EMPTY',
      catalog: { unitProducts: [], packs: [], total: 0, page: 1, pageSize: 20 },
    });
  });

  it('maps units, packs, commercial components and public availability explicitly', async () => {
    const machine = createHomeCatalogRuntimeMachine(createClient(page([unitProduct, packProduct])));

    await machine.loadInitial();

    const catalog = machine.getSnapshot().catalog;
    expect(catalog.unitProducts).toEqual([{
      kind: 'UNIT',
      id: UNIT_ID,
      name: 'Agua sintética',
      price: '2,50 €',
      volumeLabel: null,
      image: null,
      availability: 'AVAILABLE',
      containsAlcohol: false,
      minimumAge: null,
    }]);
    expect(catalog.packs).toEqual([{
      kind: 'PACK',
      id: PACK_ID,
      name: 'Pack sintético con hielo',
      price: '12,50 €',
      image: null,
      discountLabel: null,
      availability: 'TEMPORARILY_UNAVAILABLE',
      iceIncluded: true,
      containsAlcohol: true,
      minimumAge: 18,
      components: [{
        productId: COMPONENT_ID,
        name: 'Componente sintético',
        quantity: 2,
      }],
    }]);
    expect(JSON.stringify(catalog)).not.toMatch(
      /physicalStock|availableStock|reservedStock|remainingQuantity|purchaseCost|inventoryBatch/,
    );
  });

  it('connects search and category selection to product API requests', async () => {
    const client = createClient(page([unitProduct]));
    const machine = createHomeCatalogRuntimeMachine(client);
    await machine.loadInitial();

    await machine.search('  agua  ');
    await machine.selectCategory(CATEGORY_ID);

    expect(client.listProducts).toHaveBeenNthCalledWith(
      2,
      { q: 'agua', page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(client.listProducts).toHaveBeenNthCalledWith(
      3,
      { q: 'agua', category: CATEGORY_ID, page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('keeps a search with no results recoverable and clears it without a new state', async () => {
    const client = createClient(page([unitProduct]));
    const listProducts = vi.mocked(client.listProducts);
    listProducts
      .mockImplementationOnce(async () => response(page([unitProduct])))
      .mockImplementationOnce(async () => response(page([])))
      .mockImplementationOnce(async () => response(page([unitProduct])));
    const machine = createHomeCatalogRuntimeMachine(client);
    await machine.loadInitial();

    await machine.search('sin coincidencias');
    expect(machine.getSnapshot()).toMatchObject({
      catalogState: 'HOME_CATALOG_READY',
      searchValue: 'sin coincidencias',
      catalog: { total: 0, categories: [{ id: CATEGORY_ID }] },
    });

    await machine.clearFilters();
    expect(machine.getSnapshot()).toMatchObject({
      catalogState: 'HOME_CATALOG_READY',
      searchValue: '',
      selectedCategoryId: undefined,
      catalog: { total: 1 },
    });
    expect(client.listProducts).toHaveBeenNthCalledWith(
      3,
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('keeps an empty category filter recoverable and toggles the active category off', async () => {
    const client = createClient(page([unitProduct]));
    const listProducts = vi.mocked(client.listProducts);
    listProducts
      .mockImplementationOnce(async () => response(page([unitProduct])))
      .mockImplementationOnce(async () => response(page([])))
      .mockImplementationOnce(async () => response(page([unitProduct])));
    const machine = createHomeCatalogRuntimeMachine(client);
    await machine.loadInitial();

    await machine.selectCategory(CATEGORY_ID);
    expect(machine.getSnapshot()).toMatchObject({
      catalogState: 'HOME_CATALOG_READY',
      selectedCategoryId: CATEGORY_ID,
      catalog: { total: 0 },
    });

    await machine.selectCategory(CATEGORY_ID);
    expect(machine.getSnapshot()).toMatchObject({
      catalogState: 'HOME_CATALOG_READY',
      selectedCategoryId: undefined,
      catalog: { total: 1 },
    });
    expect(client.listProducts).toHaveBeenNthCalledWith(
      3,
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('aborts the previous request and ignores its late response', async () => {
    const oldRequest = deferred<CatalogResponse<PublicProductPageDto>>();
    const currentRequest = deferred<CatalogResponse<PublicProductPageDto>>();
    const client = createClient(page([unitProduct]));
    const listProducts = vi.mocked(client.listProducts);
    listProducts
      .mockImplementationOnce(async () => response(page([unitProduct])))
      .mockImplementationOnce(() => oldRequest.promise)
      .mockImplementationOnce(() => currentRequest.promise);
    const machine = createHomeCatalogRuntimeMachine(client);
    await machine.loadInitial();

    const oldResult = machine.search('antiguo');
    const oldSignal = listProducts.mock.calls[1]?.[1]?.signal;
    const currentResult = machine.search('actual');

    expect(oldSignal?.aborted).toBe(true);
    currentRequest.resolve(response(page([{ ...unitProduct, name: 'Resultado actual' }])));
    await currentResult;
    oldRequest.resolve(response(page([{ ...unitProduct, name: 'Resultado antiguo' }])));
    await oldResult;

    expect(machine.getSnapshot().catalog.unitProducts[0]?.name).toBe('Resultado actual');
    expect(machine.getSnapshot().searchValue).toBe('actual');
  });

  it('uses a public server error message and hides unexpected error details', async () => {
    const publicError = new CatalogClientError('HTTP_ERROR', 'Consulta pública inválida.', {
      status: 400,
      correlationId: CORRELATION_ID,
      publicError: {
        code: 'INVALID_INPUT',
        message: 'Consulta pública inválida.',
        correlationId: CORRELATION_ID,
      },
    });
    const publicClient: MvpCatalogClient = {
      listCategories: vi.fn(async () => { throw publicError; }),
      listProducts: vi.fn(async () => response(page([]))),
    };
    const publicMachine = createHomeCatalogRuntimeMachine(publicClient);
    await publicMachine.loadInitial();
    expect(publicMachine.getSnapshot()).toMatchObject({
      catalogState: 'HOME_CATALOG_ERROR',
      errorMessage: 'Consulta pública inválida.',
    });

    const unexpectedClient: MvpCatalogClient = {
      listCategories: vi.fn(async () => { throw new Error('SQL /srv/private inventory'); }),
      listProducts: vi.fn(async () => response(page([]))),
    };
    const unexpectedMachine = createHomeCatalogRuntimeMachine(unexpectedClient);
    await unexpectedMachine.loadInitial();
    expect(unexpectedMachine.getSnapshot().errorMessage).toBe(
      'No pudimos cargar el catálogo. Inténtalo de nuevo.',
    );
    expect(unexpectedMachine.getSnapshot().errorMessage).not.toMatch(/SQL|\/srv|inventory/);

    const internalHttpError = new CatalogClientError('HTTP_ERROR', 'Internal database path', {
      status: 500,
      correlationId: CORRELATION_ID,
      publicError: {
        code: 'CONFIGURATION_UNAVAILABLE',
        message: 'Internal database path',
        correlationId: CORRELATION_ID,
      },
    });
    const internalHttpClient: MvpCatalogClient = {
      listCategories: vi.fn(async () => { throw internalHttpError; }),
      listProducts: vi.fn(async () => response(page([]))),
    };
    const internalHttpMachine = createHomeCatalogRuntimeMachine(internalHttpClient);
    await internalHttpMachine.loadInitial();
    expect(internalHttpMachine.getSnapshot().errorMessage).toBe(
      'No pudimos cargar el catálogo. Inténtalo de nuevo.',
    );
  });
});

describe('Home catalog runtime UI wiring', () => {
  it('renders loading and then a valid canonical empty state', async () => {
    const productsRequest = deferred<CatalogResponse<PublicProductPageDto>>();
    const client: MvpCatalogClient = {
      listCategories: vi.fn(async () => response([])),
      listProducts: vi.fn(() => productsRequest.promise),
    };
    render(<HomeCatalogRuntime client={client} />);

    expect(document.querySelector('.hly-app-shell')).toHaveAttribute(
      'data-home-catalog-state',
      'HOME_CATALOG_LOADING',
    );

    productsRequest.resolve(response(page([])));
    expect(await screen.findByText('Catálogo temporalmente vacío')).toBeInTheDocument();
    expect(document.querySelector('.hly-app-shell')).toHaveAttribute(
      'data-home-catalog-state',
      'HOME_CATALOG_EMPTY',
    );
    expect(screen.queryByText('Victoria Málaga')).not.toBeInTheDocument();
  });

  it('submits search and category interactions through the injected API client', async () => {
    const client = createClient(page([unitProduct]));
    render(<HomeCatalogRuntime client={client} />);
    await screen.findByText('Agua sintética');

    const search = screen.getByRole('searchbox', {
      name: 'Busca productos',
    });
    fireEvent.change(search, { target: { value: 'agua' } });
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar en el catálogo' }));
    await waitFor(() => expect(client.listProducts).toHaveBeenCalledTimes(2));
    await screen.findByText('Agua sintética');

    fireEvent.click(screen.getByRole('button', { name: 'Bebidas sintéticas' }));
    await waitFor(() => expect(client.listProducts).toHaveBeenCalledTimes(3));

    expect(client.listProducts).toHaveBeenLastCalledWith(
      { q: 'agua', category: CATEGORY_ID, page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('keeps filtered-empty controls visible and recovers through Limpiar filtros', async () => {
    const client = createClient(page([unitProduct]));
    const listProducts = vi.mocked(client.listProducts);
    listProducts
      .mockImplementationOnce(async () => response(page([unitProduct])))
      .mockImplementationOnce(async () => response(page([])))
      .mockImplementationOnce(async () => response(page([unitProduct])));
    render(<HomeCatalogRuntime client={client} />);
    await screen.findByText('Agua sintética');

    const search = screen.getByRole('searchbox', {
      name: 'Busca productos',
    });
    fireEvent.change(search, { target: { value: 'inexistente' } });
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar en el catálogo' }));

    expect(await screen.findByRole('heading', { name: 'No encontramos productos' }))
      .toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('inexistente');
    expect(screen.getByRole('button', { name: 'Bebidas sintéticas' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(await screen.findByText('Agua sintética')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(client.listProducts).toHaveBeenLastCalledWith(
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('keeps controls mounted across overlapping searches and renders only the newest result', async () => {
    const firstSearch = deferred<CatalogResponse<PublicProductPageDto>>();
    const secondSearch = deferred<CatalogResponse<PublicProductPageDto>>();
    const client = createClient(page([unitProduct]));
    const listProducts = vi.mocked(client.listProducts);
    listProducts
      .mockImplementationOnce(async () => response(page([unitProduct])))
      .mockImplementationOnce(() => firstSearch.promise)
      .mockImplementationOnce(() => secondSearch.promise);
    render(<HomeCatalogRuntime client={client} />);
    await screen.findByText('Agua sintética');

    let search = screen.getByRole('searchbox', { name: 'Busca productos' });
    fireEvent.change(search, { target: { value: 'primera' } });
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar en el catálogo' }));

    expect(document.querySelector('.hly-app-shell')).toHaveAttribute(
      'data-home-catalog-state',
      'HOME_CATALOG_READY',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Actualizando catálogo…');
    expect(document.querySelector('#main-content')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Agua sintética')).not.toBeInTheDocument();
    search = screen.getByRole('searchbox', { name: 'Busca productos' });
    fireEvent.change(search, { target: { value: 'segunda' } });
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar en el catálogo' }));

    expect(listProducts.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Actualizando catálogo…');
    expect(screen.queryByText('Agua sintética')).not.toBeInTheDocument();
    await act(async () => {
      secondSearch.resolve(response(page([{ ...unitProduct, name: 'Resultado más nuevo' }])));
      await secondSearch.promise;
    });
    expect(await screen.findByText('Resultado más nuevo')).toBeInTheDocument();
    expect(screen.queryByText('Actualizando catálogo…')).not.toBeInTheDocument();
    expect(document.querySelector('#main-content')).not.toHaveAttribute('aria-busy');

    await act(async () => {
      firstSearch.resolve(response(page([{ ...unitProduct, name: 'Resultado antiguo' }])));
      await firstSearch.promise;
    });
    expect(screen.getByText('Resultado más nuevo')).toBeInTheDocument();
    expect(screen.queryByText('Resultado antiguo')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Busca productos' })).toHaveValue('segunda');
  });
});
