'use client';

import React from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppShell } from '../../components/AppShell';
import { Button } from '../../components/Button';
import { FeedbackState } from '../../components/FeedbackState';
import { StatusBadge, type StatusTone } from '../../components/StatusBadge';
import type {
  ProductDetailAvailability,
  ProductDetailState,
  ProductDetailViewModel,
} from './product-detail.types';

export interface ProductDetailScreenProps {
  state: ProductDetailState;
  product?: ProductDetailViewModel;
  errorMessage?: string;
  onBack?: () => void;
  onRetry?: () => void;
}

const availabilityCopy: Record<
  ProductDetailAvailability,
  { label: string; tone: StatusTone }
> = {
  AVAILABLE: { label: 'Disponible', tone: 'success' },
  UNAVAILABLE: { label: 'No disponible', tone: 'warning' },
  TEMPORARILY_UNAVAILABLE: {
    label: 'Temporalmente no disponible',
    tone: 'warning',
  },
};

const ProductDetailLoading = () => (
  <main
    className="hly-product-detail hly-product-detail--loading"
    id="main-content"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span className="hly-visually-hidden">Cargando detalle del producto</span>
    <span className="hly-skeleton hly-product-detail__skeleton-back" aria-hidden="true" />
    <span className="hly-skeleton hly-product-detail__skeleton-image" aria-hidden="true" />
    <span className="hly-skeleton hly-product-detail__skeleton-title" aria-hidden="true" />
    <span className="hly-skeleton hly-product-detail__skeleton-copy" aria-hidden="true" />
    <span className="hly-skeleton hly-product-detail__skeleton-copy" aria-hidden="true" />
  </main>
);

const ProductDetailReady = ({
  product,
  onBack,
}: {
  product: ProductDetailViewModel;
  onBack?: () => void;
}) => {
  const availability = availabilityCopy[product.availability];
  const ageLabel = product.containsAlcohol
    ? product.minimumAge === null
      ? 'Contiene alcohol'
      : `Venta ${product.minimumAge}+`
    : null;

  return (
    <main className="hly-product-detail" id="main-content">
      {onBack ? (
        <Button className="hly-product-detail__back" variant="ghost" onClick={onBack}>
          ← Volver al catálogo
        </Button>
      ) : null}

      <section className="hly-product-detail__hero" aria-labelledby="product-detail-title">
        <div className="hly-product-detail__image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <span aria-hidden="true">{product.name.slice(0, 1)}</span>
          )}
        </div>

        <div className="hly-product-detail__summary">
          <div className="hly-product-detail__badges">
            <StatusBadge tone={availability.tone}>{availability.label}</StatusBadge>
            {product.isPack ? <StatusBadge tone="info">Pack</StatusBadge> : null}
            {ageLabel ? <StatusBadge tone="warning">{ageLabel}</StatusBadge> : null}
          </div>
          <p className="hly-product-detail__eyebrow">
            {[product.brand, product.volumeLabel].filter(Boolean).join(' · ') || product.sku}
          </p>
          <h1 id="product-detail-title">{product.name}</h1>
          {product.description ? (
            <p className="hly-product-detail__description">{product.description}</p>
          ) : null}
          <p className="hly-product-detail__price">{product.price}</p>
          {product.unitPriceLabel ? (
            <p className="hly-product-detail__unit-price">{product.unitPriceLabel}</p>
          ) : null}
        </div>
      </section>

      <section className="hly-product-detail__facts" aria-labelledby="product-detail-information">
        <h2 id="product-detail-information">Información del producto</h2>
        <dl>
          {product.volumeLabel ? (
            <div><dt>Formato</dt><dd>{product.volumeLabel}</dd></div>
          ) : null}
          <div><dt>Límite por pedido</dt><dd>{product.maxPerOrder}</dd></div>
          {product.temperatureLabel ? (
            <div><dt>Temperatura</dt><dd>{product.temperatureLabel}</dd></div>
          ) : null}
          {product.readyToConsume !== null ? (
            <div>
              <dt>Listo para consumir</dt>
              <dd>{product.readyToConsume ? 'Sí' : 'No'}</dd>
            </div>
          ) : null}
          {product.containsAlcohol ? (
            <div>
              <dt>Alcohol</dt>
              <dd>
                {product.alcoholPercentage !== null
                  ? `${product.alcoholPercentage}% · ${ageLabel}`
                  : ageLabel}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {product.isPack ? (
        <section className="hly-product-detail__bundle" aria-labelledby="product-detail-composition">
          <div className="hly-product-detail__section-heading">
            <h2 id="product-detail-composition">Composición del pack</h2>
            {product.iceIncluded ? <StatusBadge tone="info">Hielo incluido</StatusBadge> : null}
          </div>
          <ul>
            {product.bundleComponents.map((component) => (
              <li key={component.productId}>
                <span>{component.name}</span>
                <strong>{component.quantity} × incluido</strong>
              </li>
            ))}
          </ul>
          <p className="hly-product-detail__bundle-note">
            Las cantidades indican la composición comercial del pack, no unidades en stock.
          </p>
        </section>
      ) : null}

      <section className="hly-product-detail__commercial-note" aria-label="Disponibilidad comercial">
        <p>
          {product.availability === 'AVAILABLE'
            ? 'La compra se habilitará en una etapa posterior.'
            : 'Este producto no puede añadirse a un pedido ahora.'}
        </p>
        <Button fullWidth disabled>
          Añadir al carrito · Próximamente
        </Button>
      </section>
    </main>
  );
};

export function ProductDetailScreen({
  state,
  product,
  errorMessage = 'No pudimos cargar el producto. Inténtalo de nuevo.',
  onBack,
  onRetry,
}: ProductDetailScreenProps) {
  const safeState = state === 'PRODUCT_DETAIL_READY' && !product
    ? 'PRODUCT_DETAIL_ERROR'
    : state;

  return (
    <AppShell
      screenState={safeState}
      data-product-detail-state={safeState}
    >
      <AppHeader variant="internal" profileDisabled cartDisabled />
      {safeState === 'PRODUCT_DETAIL_LOADING' ? <ProductDetailLoading /> : null}
      {safeState === 'PRODUCT_DETAIL_NOT_FOUND' ? (
        <main id="main-content" className="hly-product-detail__feedback">
          <FeedbackState
            variant="empty"
            title="Producto no encontrado"
            message="Este producto no está disponible en el catálogo público."
            primaryAction={onBack ? { label: 'Volver al catálogo', onAction: onBack } : undefined}
          />
        </main>
      ) : null}
      {safeState === 'PRODUCT_DETAIL_ERROR' ? (
        <main id="main-content" className="hly-product-detail__feedback">
          <FeedbackState
            variant="offline"
            title="No pudimos cargar el producto"
            message={errorMessage}
            primaryAction={onRetry ? {
              label: 'Reintentar',
              onAction: onRetry,
              icon: 'refresh',
            } : undefined}
            secondaryAction={onBack ? {
              label: 'Volver al catálogo',
              onAction: onBack,
            } : undefined}
          />
        </main>
      ) : null}
      {safeState === 'PRODUCT_DETAIL_READY' && product ? (
        <ProductDetailReady product={product} onBack={onBack} />
      ) : null}
    </AppShell>
  );
}
