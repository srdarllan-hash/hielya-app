'use client';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  HomeScreen,
  type HomeCatalogState,
  type HomeCatalogViewModel,
} from '@hielya/ui';

import {
  CatalogClientError,
  createMvpCatalogClient,
  type MvpCatalogClient,
} from './catalog-client';
import {
  mapPublicCatalog,
  mapPublicProductPage,
} from './home-catalog-mapper';

import { useStoreAvailability, type AvailabilityClient } from './store-availability';

const FIRST_PAGE = 1;
const PAGE_SIZE = 20;
const SAFE_ERROR_MESSAGE = 'No pudimos cargar el catálogo. Inténtalo de nuevo.';

const EMPTY_CATALOG: HomeCatalogViewModel = {
  categories: [],
  unitProducts: [],
  packs: [],
  page: FIRST_PAGE,
  pageSize: PAGE_SIZE,
  total: 0,
};

export interface HomeCatalogRuntimeSnapshot {
  catalogState: HomeCatalogState;
  catalog: HomeCatalogViewModel;
  isRefreshing: boolean;
  errorMessage?: string;
  searchValue: string;
  selectedCategoryId?: string;
}

interface CatalogCriteria {
  q?: string;
  category?: string;
}

export interface HomeCatalogRuntimeMachine {
  getSnapshot(): HomeCatalogRuntimeSnapshot;
  subscribe(listener: (snapshot: HomeCatalogRuntimeSnapshot) => void): () => void;
  loadInitial(): Promise<void>;
  search(value: string): Promise<void>;
  selectCategory(categoryId: string): Promise<void>;
  clearFilters(): Promise<void>;
  retry(): Promise<void>;
  cancel(): void;
}

export interface HomeCatalogRuntimeProps {
  client?: MvpCatalogClient;
  availabilityClient?: AvailabilityClient;
  requestTimeoutMs?: number;
  onOpenProduct?: (productId: string) => void;
}

const hasActiveCriteria = (criteria: CatalogCriteria): boolean => Boolean(
  criteria.q || criteria.category,
);

const catalogStateFor = (
  catalog: HomeCatalogViewModel,
  criteria: CatalogCriteria = {},
): HomeCatalogState => (
  catalog.total === 0 && !hasActiveCriteria(criteria)
    ? 'HOME_CATALOG_EMPTY'
    : 'HOME_CATALOG_READY'
);

const publicErrorMessage = (error: unknown): string => {
  if (
    error instanceof CatalogClientError
    && error.kind === 'HTTP_ERROR'
    && error.options.publicError
    && (error.options.status === 400 || error.options.status === 404)
  ) {
    return error.options.publicError.message;
  }
  return SAFE_ERROR_MESSAGE;
};

export const createHomeCatalogRuntimeMachine = (
  client: MvpCatalogClient,
  requestTimeoutMs?: number,
): HomeCatalogRuntimeMachine => {
  let snapshot: HomeCatalogRuntimeSnapshot = {
    catalogState: 'HOME_CATALOG_LOADING',
    catalog: EMPTY_CATALOG,
    isRefreshing: false,
    searchValue: '',
  };
  let activeRequest: AbortController | undefined;
  let requestSequence = 0;
  let categories = EMPTY_CATALOG.categories;
  let criteria: CatalogCriteria = {};
  let initialLoadCompleted = false;
  const listeners = new Set<(value: HomeCatalogRuntimeSnapshot) => void>();

  const publish = (value: HomeCatalogRuntimeSnapshot) => {
    snapshot = value;
    for (const listener of listeners) listener(value);
  };

  const beginRequest = () => {
    activeRequest?.abort();
    activeRequest = new AbortController();
    requestSequence += 1;
    return { controller: activeRequest, sequence: requestSequence };
  };

  const isCurrent = (sequence: number): boolean => sequence === requestSequence;

  const loadProducts = async (nextCriteria: CatalogCriteria): Promise<void> => {
    const request = beginRequest();
    criteria = nextCriteria;
    const searchValue = nextCriteria.q ?? '';
    const selectedCategoryId = nextCriteria.category;

    publish({
      catalogState: initialLoadCompleted ? 'HOME_CATALOG_READY' : 'HOME_CATALOG_LOADING',
      catalog: initialLoadCompleted ? {
        categories,
        unitProducts: [],
        packs: [],
        page: FIRST_PAGE,
        pageSize: PAGE_SIZE,
        total: 0,
      } : EMPTY_CATALOG,
      isRefreshing: initialLoadCompleted,
      searchValue,
      selectedCategoryId,
    });

    try {
      const productResponse = await client.listProducts(
        {
          ...(nextCriteria.q ? { q: nextCriteria.q } : {}),
          ...(nextCriteria.category ? { category: nextCriteria.category } : {}),
          page: FIRST_PAGE,
          pageSize: PAGE_SIZE,
        },
        { signal: request.controller.signal, timeoutMs: requestTimeoutMs },
      );
      if (!isCurrent(request.sequence)) return;

      const catalog = mapPublicProductPage(productResponse.data, categories);
      publish({
        catalogState: catalogStateFor(catalog, nextCriteria),
        catalog,
        isRefreshing: false,
        searchValue,
        selectedCategoryId,
      });
    } catch (error) {
      if (!isCurrent(request.sequence)) return;
      if (error instanceof CatalogClientError && error.kind === 'ABORTED') return;
      publish({
        catalogState: 'HOME_CATALOG_ERROR',
        catalog: {
          categories,
          unitProducts: [],
          packs: [],
          page: FIRST_PAGE,
          pageSize: PAGE_SIZE,
          total: 0,
        },
        isRefreshing: false,
        errorMessage: publicErrorMessage(error),
        searchValue,
        selectedCategoryId,
      });
    }
  };

  const machine: HomeCatalogRuntimeMachine = {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async loadInitial() {
      const request = beginRequest();
      initialLoadCompleted = false;
      categories = [];
      criteria = {};
      publish({
        catalogState: 'HOME_CATALOG_LOADING',
        catalog: EMPTY_CATALOG,
        isRefreshing: false,
        searchValue: '',
      });

      try {
        const [categoryResponse, productResponse] = await Promise.all([
          client.listCategories({
            signal: request.controller.signal,
            timeoutMs: requestTimeoutMs,
          }),
          client.listProducts(
            { page: FIRST_PAGE, pageSize: PAGE_SIZE },
            { signal: request.controller.signal, timeoutMs: requestTimeoutMs },
          ),
        ]);
        if (!isCurrent(request.sequence)) return;

        const catalog = mapPublicCatalog(categoryResponse.data, productResponse.data);
        categories = catalog.categories;
        initialLoadCompleted = true;
        publish({
          catalogState: catalogStateFor(catalog),
          catalog,
          isRefreshing: false,
          searchValue: '',
        });
      } catch (error) {
        if (!isCurrent(request.sequence)) return;
        request.controller.abort();
        if (error instanceof CatalogClientError && error.kind === 'ABORTED') return;
        publish({
          catalogState: 'HOME_CATALOG_ERROR',
          catalog: EMPTY_CATALOG,
          isRefreshing: false,
          errorMessage: publicErrorMessage(error),
          searchValue: '',
        });
      }
    },
    search(value) {
      const normalized = value.trim();
      return loadProducts({
        ...(normalized ? { q: normalized } : {}),
        ...(criteria.category ? { category: criteria.category } : {}),
      });
    },
    selectCategory(categoryId) {
      return loadProducts({
        ...(criteria.q ? { q: criteria.q } : {}),
        ...(criteria.category === categoryId ? {} : { category: categoryId }),
      });
    },
    clearFilters() {
      return loadProducts({});
    },
    retry() {
      return initialLoadCompleted ? loadProducts(criteria) : machine.loadInitial();
    },
    cancel() {
      requestSequence += 1;
      activeRequest?.abort();
    },
  };

  return machine;
};

export function HomeCatalogRuntime({
  client: injectedClient,
  availabilityClient,
  requestTimeoutMs,
  onOpenProduct,
}: HomeCatalogRuntimeProps) {
  const { availability, session } = useStoreAvailability(availabilityClient);
  const notices: { tone: 'warning' | 'info'; text: string }[] = [];
  if (availability?.demand.level === 'HIGH' && availability.demand.estimate) notices.push({ tone: 'warning', text: `Alta demanda · La estimación actual es de ${availability.demand.estimate.minimumMinutes}–${availability.demand.estimate.upperBoundMinutes} min` });
  if (availability?.alcohol.status === 'UNAVAILABLE') {
    const cutoff = availability.alcohol.snapshot?.alcoholOrderCutoffAt;
    notices.push({ tone: 'info', text: availability.alcohol.reason === 'CUTOFF_REACHED' && cutoff
      ? `Alcohol no disponible después de las ${new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(cutoff))} hoy`
      : 'Alcohol temporalmente no disponible' });
  }
  const client = useMemo(
    () => injectedClient ?? createMvpCatalogClient(),
    [injectedClient],
  );
  const machine = useMemo(
    () => createHomeCatalogRuntimeMachine(client, requestTimeoutMs),
    [client, requestTimeoutMs],
  );
  const [snapshot, setSnapshot] = useState(machine.getSnapshot());

  useEffect(() => {
    const unsubscribe = machine.subscribe(setSnapshot);
    void machine.loadInitial();
    return () => {
      unsubscribe();
      machine.cancel();
    };
  }, [machine]);

  const openProduct = (productId: string) => {
    if (onOpenProduct) {
      onOpenProduct(productId);
      return;
    }
    globalThis.location.assign(`/products/${encodeURIComponent(productId)}`);
  };

  const add = async (id: string, kind: 'add-product' | 'add-pack') => {
    const product = [...snapshot.catalog.unitProducts,...snapshot.catalog.packs].find(p => p.id === id);
    if (!product || product.availability !== 'AVAILABLE') return;
    if (await session.allow(product.containsAlcohol)) window.dispatchEvent(new CustomEvent('hielya:ui-action',{detail:{action:kind,value:id}}));
  };
  return (
    <HomeScreen
      alcoholBlocked={!availability || availability.alcohol.status !== 'AVAILABLE'}
      storeBlocked={availability !== undefined && availability.storeStatus !== 'OPEN'}
      availabilityNotices={notices}
      onAddProduct={id => void add(id,'add-product')}
      onAddPack={id => void add(id,'add-pack')}
      catalogState={snapshot.catalogState}
      catalog={snapshot.catalog}
      isRefreshing={snapshot.isRefreshing}
      cartCount={0}
      selectedCategoryId={snapshot.selectedCategoryId}
      searchValue={snapshot.searchValue}
      errorMessage={snapshot.errorMessage}
      onRetryCatalog={() => void machine.retry()}
      onClearCatalogFilters={() => void machine.clearFilters()}
      onSearch={(value) => void machine.search(value)}
      onSelectCategory={(categoryId) => void machine.selectCategory(categoryId)}
      onOpenProduct={openProduct}
    />
  );
}
