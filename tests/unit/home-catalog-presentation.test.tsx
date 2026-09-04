import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HOME_CATALOG_STATES,
  HomeScreen,
  type HomeCatalogViewModel,
} from '@hielya/ui';

const emptyCatalog: HomeCatalogViewModel = {
  categories: [],
  unitProducts: [],
  packs: [],
  page: 1,
  pageSize: 20,
  total: 0,
};

const readyCatalog: HomeCatalogViewModel = {
  categories: [
    { id: 'category-cold', label: 'Frías' },
  ],
  unitProducts: [
    {
      kind: 'UNIT',
      id: 'unit-available',
      name: 'Bebida sintética',
      price: '2,50 €',
      availability: 'AVAILABLE',
      containsAlcohol: true,
      minimumAge: 18,
    },
    {
      kind: 'UNIT',
      id: 'unit-unavailable',
      name: 'Producto temporal',
      price: '1,90 €',
      availability: 'TEMPORARILY_UNAVAILABLE',
      containsAlcohol: false,
    },
  ],
  packs: [
    {
      kind: 'PACK',
      id: 'pack-with-ice',
      name: 'Pack sintético',
      price: '12,00 €',
      availability: 'AVAILABLE',
      iceIncluded: true,
      containsAlcohol: true,
      minimumAge: 18,
      components: [
        { productId: 'unit-available', name: 'Bebida sintética', quantity: 4 },
        { productId: 'unit-ice', name: 'Hielo sintético', quantity: 1 },
      ],
    },
  ],
  page: 1,
  pageSize: 20,
  total: 3,
};

afterEach(cleanup);

describe('C-005 Home catalog presentation boundary', () => {
  it('defines the four explicit runtime catalog states', () => {
    expect(HOME_CATALOG_STATES).toEqual([
      'HOME_CATALOG_LOADING',
      'HOME_CATALOG_READY',
      'HOME_CATALOG_EMPTY',
      'HOME_CATALOG_ERROR',
    ]);
  });

  it('renders loading, empty and controlled error through the existing feedback components', () => {
    const { rerender } = render(
      <HomeScreen catalogState="HOME_CATALOG_LOADING" catalog={emptyCatalog} />,
    );

    expect(document.querySelector('[data-home-catalog-state="HOME_CATALOG_LOADING"]')).toBeInTheDocument();
    expect(screen.getByText('Cargando la tienda HIELYA')).toBeInTheDocument();

    rerender(<HomeScreen catalogState="HOME_CATALOG_EMPTY" catalog={emptyCatalog} />);
    expect(document.querySelector('[data-home-catalog-state="HOME_CATALOG_EMPTY"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Catálogo temporalmente vacío' })).toBeInTheDocument();
    expect(screen.queryByText('Victoria Málaga')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Resumen de entrega')).not.toBeInTheDocument();

    rerender(
      <HomeScreen
        catalogState="HOME_CATALOG_ERROR"
        catalog={emptyCatalog}
        errorMessage="El catálogo no está disponible."
      />,
    );
    expect(document.querySelector('[data-home-catalog-state="HOME_CATALOG_ERROR"]')).toBeInTheDocument();
    expect(screen.getByText('El catálogo no está disponible.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/sql|stack|database path/i);
  });

  it('renders explicitly injected units and packs without requiring optional images, volume or discount', () => {
    render(<HomeScreen catalogState="HOME_CATALOG_READY" catalog={readyCatalog} />);

    expect(document.querySelector('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Busca productos' }))
      .toHaveAttribute('placeholder', 'Busca productos…');
    expect(screen.getByRole('heading', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Packs y combos' })).toBeInTheDocument();
    expect(screen.queryByText('Más vendidos')).not.toBeInTheDocument();
    expect(screen.queryByText('Packs y promociones')).not.toBeInTheDocument();
    expect(screen.getByText('Bebida sintética')).toBeInTheDocument();
    expect(screen.getByText('Venta 18+')).toBeInTheDocument();
    expect(screen.getByText('Temporalmente no disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Producto temporal no disponible' })).toBeDisabled();
    expect(screen.getByText('Pack sintético')).toBeInTheDocument();
    expect(screen.getByText('• 4x Bebida sintética')).toBeInTheDocument();
    expect(screen.getByText('• Hielo incluido')).toBeInTheDocument();
    expect(screen.queryByLabelText(/artículos/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/physicalStock|reservedStock|availableQuantity/);
  });

  it('forwards search, category and retry callbacks while keeping presentation state local', () => {
    const onSearch = vi.fn();
    const onSelectCategory = vi.fn();
    const onRetryCatalog = vi.fn();
    const { rerender } = render(
      <HomeScreen
        catalogState="HOME_CATALOG_READY"
        catalog={readyCatalog}
        onSearch={onSearch}
        onSelectCategory={onSelectCategory}
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'hielo' } });
    fireEvent.submit(screen.getByRole('search'));
    fireEvent.click(screen.getByRole('button', { name: 'Frías' }));
    expect(onSearch).toHaveBeenCalledWith('hielo');
    expect(onSelectCategory).toHaveBeenCalledWith('category-cold');

    rerender(
      <HomeScreen
        catalogState="HOME_CATALOG_ERROR"
        catalog={emptyCatalog}
        onRetryCatalog={onRetryCatalog}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetryCatalog).toHaveBeenCalledOnce();
  });

  it('renders filtered empty inline without hiding search or categories', () => {
    const onClearCatalogFilters = vi.fn();
    render(
      <HomeScreen
        catalogState="HOME_CATALOG_READY"
        catalog={{
          categories: readyCatalog.categories,
          unitProducts: [],
          packs: [],
          page: 1,
          pageSize: 20,
          total: 0,
        }}
        selectedCategoryId="category-cold"
        searchValue="sin resultado"
        onClearCatalogFilters={onClearCatalogFilters}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No encontramos productos' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('sin resultado');
    expect(screen.getByRole('button', { name: 'Frías' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(onClearCatalogFilters).toHaveBeenCalledOnce();
  });

  it('keeps filter controls enabled and hides stale cards while refreshing', () => {
    render(
      <HomeScreen
        catalogState="HOME_CATALOG_READY"
        catalog={{
          categories: readyCatalog.categories,
          unitProducts: [],
          packs: [],
          page: 1,
          pageSize: 20,
          total: 0,
        }}
        isRefreshing
        searchValue="nuevo criterio"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Actualizando catálogo…');
    expect(screen.getByRole('searchbox', { name: 'Busca productos' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Frías' })).toBeEnabled();
    expect(screen.queryByText('Bebida sintética')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No encontramos productos' }))
      .not.toBeInTheDocument();
  });

  it('does not import the historical fixture from the runtime Home presentation', () => {
    const source = readFileSync(resolve(
      process.cwd(),
      'packages/ui/src/screens/home/HomeScreen.tsx',
    ), 'utf8');
    expect(source).not.toMatch(/from ['"].*home\.data['"]/);
  });
});
