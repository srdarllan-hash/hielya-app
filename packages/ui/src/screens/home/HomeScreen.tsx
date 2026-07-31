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
import { Snackbar } from '../../components/Snackbar';
import { DeliveryQuoteCard } from '../../components/DeliveryQuoteCard';
import { emitHielyaUiAction } from '../../lib/ui-actions';
import { categories, products, packs, heroImage } from './home.data';
import type { HomeState } from './home.types';

export interface HomeScreenProps { state?: HomeState; }

const notices: Partial<Record<HomeState, { tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; text: string }>> = {
  closed: { tone: 'warning', text: 'Tienda cerrada · Volvemos mañana a las 10:00' },
  'high-demand': { tone: 'warning', text: 'Alta demanda · La estimación actual es de 45–60 min' },
  'alcohol-cutoff': { tone: 'info', text: 'Alcohol no disponible: la entrega debe finalizar antes de las 22:00' },
  'out-of-area': { tone: 'danger', text: 'Esta dirección está fuera del área actual de 4 km' },
};

export function HomeScreen({ state = 'ready' }: HomeScreenProps) {
  const blocked = state === 'closed' || state === 'out-of-area';
  const notice = notices[state];
  const cartCount = state === 'empty-cart' ? 0 : 3;
  const eta = state === 'high-demand' ? '45–60 min' : '30–45 min';
  const action = (name: string, value?: string) => () => emitHielyaUiAction(name, value);

  return (
    <AppShell screenState={state}>
      <AppHeader
        cartCount={cartCount}
        onProfile={action('open-profile')}
        onCart={action('open-cart')}
      />
      {state === 'loading' ? (
        <HomeLoadingState />
      ) : state === 'error' ? (
        <ErrorState onAction={action('retry-home')} />
      ) : (
        <main className="hly-home" id="main-content">
          {notice ? <div className="hly-home__notice"><StatusBadge tone={notice.tone}>{notice.text}</StatusBadge></div> : null}
          <DeliveryQuoteCard blocked={blocked} eta={eta} onChangeAddress={action('change-address')} />
          <SearchField
            disabled={blocked}
            onSubmit={(value) => emitHielyaUiAction('search-submit', value)}
            onFilter={action('open-filters')}
          />
          <section className="hly-categories" aria-label="Categorías" aria-disabled={blocked || undefined}>
            {categories.map((category, index) => (
              <CategoryChip
                key={category.label}
                {...category}
                active={index === 0}
                disabled={blocked}
                onSelect={(value) => emitHielyaUiAction('select-category', value)}
              />
            ))}
          </section>
          <HeroBanner image={heroImage} />
          <section aria-labelledby="best-sellers">
            <SectionHeader id="best-sellers" title="Más vendidos" action="Ver todos" onAction={action('view-all-products')} />
            <div className="hly-product-grid">
              {products.map((product, index) => (
                <ProductCard
                  key={product.name}
                  {...product}
                  disabled={blocked}
                  lowStock={index === 1 && state === 'high-demand'}
                  onAdd={(productId) => emitHielyaUiAction('add-product', productId)}
                />
              ))}
            </div>
          </section>
          <section aria-labelledby="packs">
            <SectionHeader id="packs" title="Packs y promociones" action="Ver todos" onAction={action('view-all-packs')} />
            <div className="hly-pack-grid">
              {packs.map((pack) => (
                <PackCard
                  key={pack.name}
                  {...pack}
                  disabled={blocked}
                  onAdd={(packId) => emitHielyaUiAction('add-pack', packId)}
                />
              ))}
            </div>
          </section>
          <section className="hly-legal-strip" aria-label="Información operativa">
            <span><strong>Horario</strong>10:00–22:00</span>
            <span><strong>Alcohol</strong>Entrega antes de 22:00</span>
            <span><strong>Área</strong>Hasta 4 km</span>
          </section>
        </main>
      )}
      {state === 'empty-cart' ? <Snackbar message="Tu carrito está vacío. Añade productos para continuar." /> : null}
      <BottomNavigation active="home" onNavigate={(item) => emitHielyaUiAction('navigate', item.id)} />
    </AppShell>
  );
}
