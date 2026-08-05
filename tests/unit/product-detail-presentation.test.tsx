import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PRODUCT_DETAIL_STATES,
  ProductDetailScreen,
  type ProductDetailViewModel,
} from '@hielya/ui';

const product: ProductDetailViewModel = {
  id: '22222222-2222-4222-8222-222222222222',
  sku: 'SYN-PACK-001',
  name: 'Pack sintético con hielo',
  description: 'Descripción pública aislada.',
  brand: 'Marca sintética',
  price: '12,50 €',
  unitPriceLabel: '9,47 €/l',
  volumeLabel: '4 × 330 ml',
  image: null,
  availability: 'AVAILABLE',
  isPack: true,
  iceIncluded: true,
  maxPerOrder: 2,
  containsAlcohol: true,
  minimumAge: 18,
  alcoholPercentage: 5,
  temperatureLabel: 'Frío',
  readyToConsume: true,
  bundleComponents: [{
    productId: '33333333-3333-4333-8333-333333333333',
    sku: 'SYN-COMPONENT-001',
    name: 'Componente sintético',
    quantity: 4,
  }],
};

afterEach(cleanup);

describe('product-detail presentation boundary', () => {
  it('defines and renders the explicit loading state', () => {
    expect(PRODUCT_DETAIL_STATES).toEqual([
      'PRODUCT_DETAIL_LOADING',
      'PRODUCT_DETAIL_READY',
      'PRODUCT_DETAIL_NOT_FOUND',
      'PRODUCT_DETAIL_ERROR',
    ]);

    render(<ProductDetailScreen state="PRODUCT_DETAIL_LOADING" />);

    expect(document.querySelector('[data-product-detail-state="PRODUCT_DETAIL_LOADING"]'))
      .toBeInTheDocument();
    expect(screen.getByText('Cargando detalle del producto')).toBeInTheDocument();
  });

  it('renders a synthetic pack using only public commercial information', () => {
    render(<ProductDetailScreen state="PRODUCT_DETAIL_READY" product={product} />);

    expect(document.querySelector('[data-product-detail-state="PRODUCT_DETAIL_READY"]'))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pack sintético con hielo' })).toBeInTheDocument();
    expect(screen.getByText(/12,50\s€/)).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Venta 18+')).toBeInTheDocument();
    expect(screen.getByText('Hielo incluido')).toBeInTheDocument();
    expect(screen.getByText('Componente sintético')).toBeInTheDocument();
    expect(screen.getByText('4 × incluido')).toBeInTheDocument();
    expect(screen.getByText(/no unidades en stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Añadir al carrito/i })).toBeDisabled();
    expect(document.body.textContent).not.toMatch(
      /physicalStock|reservedStock|availableStock|purchaseCost|inventoryBatch|margin/i,
    );
  });

  it('renders unavailable public state without enabling a commercial mutation', () => {
    render(
      <ProductDetailScreen
        state="PRODUCT_DETAIL_READY"
        product={{ ...product, isPack: false, bundleComponents: [], availability: 'UNAVAILABLE' }}
      />,
    );

    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.getByText('Este producto no puede añadirse a un pedido ahora.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Añadir al carrito/i })).toBeDisabled();
  });

  it('never invents a minimum age when the public DTO omits it', () => {
    render(
      <ProductDetailScreen
        state="PRODUCT_DETAIL_READY"
        product={{ ...product, minimumAge: null, alcoholPercentage: null }}
      />,
    );

    expect(screen.getAllByText('Contiene alcohol').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain('Venta 18+');
  });

  it('keeps not-found indistinguishable from an internally hidden product', () => {
    const onBack = vi.fn();
    render(
      <ProductDetailScreen
        state="PRODUCT_DETAIL_NOT_FOUND"
        onBack={onBack}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Producto no encontrado' })).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Este producto no está disponible en el catálogo público.'))
      .toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/pausado|interno|stock|database/i);
    fireEvent.click(screen.getByRole('button', { name: 'Volver al catálogo' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders a safe recoverable error and never accepts missing READY data', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <ProductDetailScreen
        state="PRODUCT_DETAIL_ERROR"
        errorMessage="No pudimos cargar el producto. Inténtalo de nuevo."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No pudimos cargar el producto' }))
      .toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<ProductDetailScreen state="PRODUCT_DETAIL_READY" />);
    expect(document.querySelector('[data-product-detail-state="PRODUCT_DETAIL_ERROR"]'))
      .toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pack sintético con hielo' }))
      .not.toBeInTheDocument();
  });
});
