'use client';
import { useOptionalCart } from '../cart/CartProvider';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ProductDetailScreen,
  type ProductDetailState,
  type ProductDetailViewModel,
} from '@hielya/ui';

import {
  CatalogClientError,
  createMvpCatalogClient,
  type MvpProductDetailClient,
} from './catalog-client';
import { mapPublicProductToDetail } from './product-detail-mapper';

const SAFE_ERROR_MESSAGE = 'No pudimos cargar el producto. Inténtalo de nuevo.';

export interface ProductDetailRuntimeSnapshot {
  state: ProductDetailState;
  product?: ProductDetailViewModel;
}

export interface ProductDetailRuntimeMachine {
  getSnapshot(): ProductDetailRuntimeSnapshot;
  subscribe(listener: (snapshot: ProductDetailRuntimeSnapshot) => void): () => void;
  load(productId: string): Promise<void>;
  retry(): Promise<void>;
  cancel(): void;
}

export interface ProductDetailRuntimeProps {
  productId: string;
  client?: MvpProductDetailClient;
  requestTimeoutMs?: number;
  onBack?: () => void;
}

const isNotFound = (error: unknown): boolean => (
  error instanceof CatalogClientError
  && error.kind === 'HTTP_ERROR'
  && error.options.status === 404
);

export const createProductDetailRuntimeMachine = (
  client: MvpProductDetailClient,
  requestTimeoutMs?: number,
): ProductDetailRuntimeMachine => {
  let snapshot: ProductDetailRuntimeSnapshot = {
    state: 'PRODUCT_DETAIL_LOADING',
  };
  let activeRequest: AbortController | undefined;
  let requestSequence = 0;
  let currentProductId = '';
  const listeners = new Set<(value: ProductDetailRuntimeSnapshot) => void>();

  const publish = (value: ProductDetailRuntimeSnapshot) => {
    snapshot = value;
    for (const listener of listeners) listener(value);
  };

  const load = async (productId: string): Promise<void> => {
    activeRequest?.abort();
    activeRequest = new AbortController();
    requestSequence += 1;
    const sequence = requestSequence;
    currentProductId = productId;
    publish({ state: 'PRODUCT_DETAIL_LOADING' });

    try {
      const response = await client.getProduct(productId, {
        signal: activeRequest.signal,
        timeoutMs: requestTimeoutMs,
      });
      if (sequence !== requestSequence) return;
      publish({
        state: 'PRODUCT_DETAIL_READY',
        product: mapPublicProductToDetail(response.data),
      });
    } catch (error) {
      if (sequence !== requestSequence) return;
      if (error instanceof CatalogClientError && error.kind === 'ABORTED') return;
      if (isNotFound(error)) {
        publish({ state: 'PRODUCT_DETAIL_NOT_FOUND' });
        return;
      }
      publish({ state: 'PRODUCT_DETAIL_ERROR' });
    }
  };

  return {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load,
    retry() {
      return load(currentProductId);
    },
    cancel() {
      requestSequence += 1;
      activeRequest?.abort();
    },
  };
};

export function ProductDetailRuntime({
  productId,
  client: injectedClient,
  requestTimeoutMs,
  onBack,
}: ProductDetailRuntimeProps) {
  const client = useMemo(
    () => injectedClient ?? createMvpCatalogClient(),
    [injectedClient],
  );
  const machine = useMemo(
    () => createProductDetailRuntimeMachine(client, requestTimeoutMs),
    [client, requestTimeoutMs],
  );
  const [snapshot, setSnapshot] = useState(machine.getSnapshot());

  useEffect(() => {
    const unsubscribe = machine.subscribe(setSnapshot);
    void machine.load(productId);
    return () => {
      unsubscribe();
      machine.cancel();
    };
  }, [machine, productId]);

  const cart = useOptionalCart();
  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (cart) cart.navigate('/');
    else globalThis.location.assign('/');
  };

  return (
    <ProductDetailScreen
      state={snapshot.state}
      product={snapshot.product}
      errorMessage={SAFE_ERROR_MESSAGE}
      onBack={goBack}
      onRetry={() => void machine.retry()}
    />
  );
}
