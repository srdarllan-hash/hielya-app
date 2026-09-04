'use client';

import React from 'react';
import { AppShell } from '../../components/AppShell';
import { AppHeader } from '../../components/AppHeader';
import { SearchField } from '../../components/SearchField';
import { CategoryChip } from '../../components/CategoryChip';
import { HeroBanner } from '../../components/HeroBanner';
import { SectionHeader } from '../../components/SectionHeader';
import { ProductCard } from '../../components/ProductCard';
import { PackCard } from '../../components/PackCard';
import { StatusBadge } from '../../components/StatusBadge';
import { BottomNavigation } from '../../components/BottomNavigation';
import { HomeLoadingState } from '../../components/HomeLoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { Snackbar } from '../../components/Snackbar';
import { DeliveryQuoteCard } from '../../components/DeliveryQuoteCard';
import { emitHielyaUiAction } from '../../lib/ui-actions';
import type {
  HomeAvailability,
  HomeCatalogState,
  HomeCatalogViewModel,
  HomeDeliverySummaryViewModel,
  HomeOperationalFactViewModel,
  HomeState,
} from './home.types';

export interface HomeScreenProps {
  state?: HomeState;
  catalogState: HomeCatalogState;
  catalog: HomeCatalogViewModel;
  isRefreshing?: boolean;
  cartCount?: number;
  selectedCategoryId?: string;
  searchValue?: string;
  heroImage?: string;
  deliverySummary?: HomeDeliverySummaryViewModel;
  operationalFacts?: readonly HomeOperationalFactViewModel[];
  errorMessage?: string;
  onRetryCatalog?: () => void;
  onClearCatalogFilters?: () => void;
  onSearch?: (query: string) => void;
  onSelectCategory?: (categoryId: string) => void;
  onOpenProduct?: (productId: string) => void;
}

const notices: Partial<Record<HomeState, { tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; text: string }>> = {
  closed: { tone: 'warning', text: 'Tienda cerrada · Volvemos mañana a las 10:00' },
  'high-demand': { tone: 'warning', text: 'Alta demanda · La estimación actual es de 45–60 min' },
  'alcohol-cutoff': { tone: 'info', text: 'Alcohol no disponible: la entrega debe finalizar antes de las 22:00' },
  'out-of-area': { tone: 'danger', text: 'Esta dirección está fuera del área actual de 4 km' },
};

const availabilityLabel = (availability: HomeAvailability): string | undefined => {
  if (availability === 'UNAVAILABLE') return 'No disponible';
  if (availability === 'TEMPORARILY_UNAVAILABLE') return 'Temporalmente no disponible';
  return undefined;
};

const ageLabel = (containsAlcohol: boolean, minimumAge?: number | null): string | undefined => {
  if (!containsAlcohol) return undefined;
  return minimumAge ? `Venta ${minimumAge}+` : 'Contiene alcohol';
};

export function HomeScreen({
  state = 'ready',
  catalogState,
  catalog,
  isRefreshing = false,
  cartCount = 0,
  selectedCategoryId,
  searchValue,
  heroImage,
  deliverySummary,
  operationalFacts = [],
  errorMessage = 'No pudimos cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.',
  onRetryCatalog,
  onClearCatalogFilters,
  onSearch,
  onSelectCategory,
  onOpenProduct,
}: HomeScreenProps) {
  const blocked = state === 'closed' || state === 'out-of-area';
  const filteredEmpty = catalogState === 'HOME_CATALOG_READY'
    && catalog.total === 0
    && !isRefreshing;
  const notice = notices[state];
  const action = (name: string, value?: string) => () => emitHielyaUiAction(name, value);
  const retryCatalog = () => {
    emitHielyaUiAction('retry-home');
    onRetryCatalog?.();
  };

  return (
    <AppShell screenState={state} data-home-catalog-state={catalogState}>
      <AppHeader
        cartCount={cartCount}
        onProfile={action('open-profile')}
        onCart={action('open-cart')}
      />
      {catalogState === 'HOME_CATALOG_LOADING' ? (
        <HomeLoadingState />
      ) : catalogState === 'HOME_CATALOG_ERROR' ? (
        <ErrorState message={errorMessage} onAction={retryCatalog} />
      ) : catalogState === 'HOME_CATALOG_EMPTY' ? (
        <EmptyState
          title="Catálogo temporalmente vacío"
          message="No hay productos disponibles ahora. Inténtalo de nuevo más tarde."
          action={onRetryCatalog ? 'Reintentar' : undefined}
          onAction={onRetryCatalog ? retryCatalog : undefined}
        />
      ) : (
        <main className="hly-home" id="main-content" aria-busy={isRefreshing || undefined}>
          {notice ? <div className="hly-home__notice"><StatusBadge tone={notice.tone}>{notice.text}</StatusBadge></div> : null}
          {isRefreshing ? (
            <div className="hly-home__notice" role="status" aria-live="polite">
              <StatusBadge tone="neutral">Actualizando catálogo…</StatusBadge>
            </div>
          ) : null}
          {deliverySummary ? (
            <DeliveryQuoteCard
              blocked={blocked || deliverySummary.blocked}
              eta={state === 'high-demand' ? '45–60 min' : deliverySummary.eta}
              addressLine={deliverySummary.addressLine}
              localityLine={deliverySummary.localityLine}
              deliveryRadiusLabel={deliverySummary.deliveryRadiusLabel}
              minimumOrderLabel={deliverySummary.minimumOrderLabel}
              onChangeAddress={action('change-address')}
            />
          ) : null}
          <SearchField
            key={searchValue ?? ''}
            defaultValue={searchValue}
            ariaLabel="Busca productos"
            placeholder="Busca productos…"
            disabled={blocked}
            onSubmit={(value) => {
              emitHielyaUiAction('search-submit', value);
              onSearch?.(value);
            }}
            onFilter={action('open-filters')}
          />
          <section className="hly-categories" aria-label="Categorías">
            {catalog.categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.label}
                image={category.image}
                value={category.id}
                active={category.id === selectedCategoryId}
                disabled={blocked}
                onSelect={(value) => {
                  emitHielyaUiAction('select-category', value);
                  onSelectCategory?.(value);
                }}
              />
            ))}
          </section>
          {filteredEmpty ? (
            <EmptyState
              title="No encontramos productos"
              message="Prueba otra búsqueda o limpia los filtros para ver el catálogo completo."
              action={onClearCatalogFilters ? 'Limpiar filtros' : undefined}
              onAction={onClearCatalogFilters}
            />
          ) : null}
          {heroImage ? <HeroBanner image={heroImage} /> : null}
          {catalog.unitProducts.length > 0 ? (
            <section aria-labelledby="products">
              <SectionHeader id="products" title="Productos" action="Ver todos" onAction={action('view-all-products')} />
              <div className="hly-product-grid">
                {catalog.unitProducts.map((product) => {
                  const unavailable = product.availability !== 'AVAILABLE';
                  const status = [
                    availabilityLabel(product.availability),
                    ageLabel(product.containsAlcohol, product.minimumAge),
                  ].filter((label): label is string => Boolean(label)).join(' · ') || undefined;
                  return (
                    <ProductCard
                      key={product.id}
                      productId={product.id}
                      name={product.name}
                      size={product.volumeLabel}
                      price={product.price}
                      image={product.image}
                      disabled={blocked}
                      unavailable={unavailable}
                      statusLabel={status}
                      statusTone={unavailable ? 'warning' : 'info'}
                      onOpen={onOpenProduct}
                      onAdd={(productId) => emitHielyaUiAction('add-product', productId)}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
          {catalog.packs.length > 0 ? (
            <section aria-labelledby="packs">
              <SectionHeader id="packs" title="Packs y combos" action="Ver todos" onAction={action('view-all-packs')} />
              <div className="hly-pack-grid">
                {catalog.packs.map((pack) => {
                  const availability = availabilityLabel(pack.availability);
                  const alcohol = ageLabel(pack.containsAlcohol, pack.minimumAge);
                  const description = [
                    ...pack.components.map((component) => `${component.quantity}x ${component.name}`),
                    ...(pack.iceIncluded ? ['Hielo incluido'] : []),
                    ...(alcohol ? [alcohol] : []),
                    ...(availability ? [availability] : []),
                  ];
                  return (
                    <PackCard
                      key={pack.id}
                      packId={pack.id}
                      name={pack.name}
                      description={description}
                      price={pack.price}
                      discount={pack.discountLabel}
                      image={pack.image}
                      unavailable={pack.availability !== 'AVAILABLE'}
                      disabled={blocked}
                      onOpen={onOpenProduct}
                      onAdd={(packId) => emitHielyaUiAction('add-pack', packId)}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
          {operationalFacts.length > 0 ? (
            <section className="hly-legal-strip" aria-label="Información operativa">
              {operationalFacts.map((fact) => (
                <span key={fact.label}><strong>{fact.label}</strong>{fact.value}</span>
              ))}
            </section>
          ) : null}
        </main>
      )}
      {state === 'empty-cart' ? <Snackbar message="Tu carrito está vacío. Añade productos para continuar." /> : null}
      <BottomNavigation active="home" onNavigate={(item) => emitHielyaUiAction('navigate', item.id)} />
    </AppShell>
  );
}
