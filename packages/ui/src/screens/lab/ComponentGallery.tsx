'use client';

import React from 'react';
import { AppShell } from '../../components/AppShell';
import { AppHeader } from '../../components/AppHeader';
import { BrandLockup } from '../../components/BrandLockup';
import { SearchField } from '../../components/SearchField';
import { CategoryChip } from '../../components/CategoryChip';
import { HeroBanner } from '../../components/HeroBanner';
import { SectionHeader } from '../../components/SectionHeader';
import { ProductCard } from '../../components/ProductCard';
import { PackCard } from '../../components/PackCard';
import { StatusBadge } from '../../components/StatusBadge';
import { IconButton } from '../../components/IconButton';
import { BottomNavigation } from '../../components/BottomNavigation';
import { HomeLoadingState } from '../../components/HomeLoadingState';
import { FeedbackState } from '../../components/FeedbackState';
import { Snackbar } from '../../components/Snackbar';
import { DeliveryQuoteCard } from '../../components/DeliveryQuoteCard';
import { asset } from '../../lib/assets';

const noop = () => undefined;

export function ComponentGallery() {
  return (
    <AppShell screenState="component-gallery">
      <AppHeader cartCount={3} onProfile={noop} onCart={noop} />
      <main id="main-content" className="hly-component-gallery">
        <h1>Componentes canónicos · Arquitectura 1.2.0</h1>
        <p>Variantes executáveis ligadas aos Design Tokens 1.1.1.</p>
        <section>
          <SectionHeader title="Marca" />
          <div className="hly-component-gallery__row">
            <BrandLockup size="sm" showTagline={false} />
            <BrandLockup size="md" />
          </div>
        </section>
        <section>
          <SectionHeader title="Entrega e busca" />
          <DeliveryQuoteCard onChangeAddress={noop} />
          <SearchField onSubmit={noop} onFilter={noop} />
        </section>
        <section>
          <SectionHeader title="Categorias" />
          <div className="hly-categories" aria-label="Exemplos de categorias">
            <CategoryChip label="Cervezas" image={asset('categories/victoria.svg')} active onSelect={noop} />
            <CategoryChip label="Hielo" image={asset('categories/ice-bag.svg')} onSelect={noop} />
            <CategoryChip label="Snacks" image={asset('categories/lays.svg')} disabled onSelect={noop} />
          </div>
        </section>
        <section>
          <SectionHeader title="Hero" />
          <HeroBanner image={asset('hero/cold-beer-hero.svg')} />
        </section>
        <section>
          <SectionHeader title="Commerce" action="Ver todos" onAction={noop} />
          <div className="hly-product-grid">
            <ProductCard name="Victoria Málaga" size="330 ml" price="€1,40" image={asset('products/victoria.svg')} onAdd={noop} />
            <ProductCard name="Estrella Galicia" size="330 ml" price="€1,50" image={asset('products/estrella.svg')} lowStock onAdd={noop} />
            <ProductCard name="Red Bull" size="250 ml" price="€2,80" image={asset('products/redbull.svg')} unavailable onAdd={noop} />
          </div>
          <div className="hly-pack-grid hly-component-gallery__spacer">
            <PackCard
              name="Pack Cervecero"
              description={['12x Estrella Galicia 330 ml', 'Hielo en bolsa 2 kg']}
              price="€16,80"
              discount="−7%"
              image={asset('products/pack-cervecero.svg')}
              onAdd={noop}
            />
          </div>
        </section>
        <section>
          <SectionHeader title="Estados y acciones" />
          <div className="hly-component-gallery__row">
            <StatusBadge tone="success">Disponible</StatusBadge>
            <StatusBadge tone="warning">Alta demanda</StatusBadge>
            <StatusBadge tone="danger">Bloqueado</StatusBadge>
            <IconButton icon="cart" label="Carrito" badge={3} onClick={noop} />
          </div>
        </section>
        <section>
          <SectionHeader title="Feedback" />
          <FeedbackState variant="empty" title="Sin contenido" message="No hay elementos disponibles." primaryAction={{ label: 'Volver', onAction: noop }} />
          <FeedbackState variant="offline" title="Sin conexión" message="Comprueba tu conexión." primaryAction={{ label: 'Reintentar', onAction: noop, icon: 'refresh' }} />
          <HomeLoadingState />
        </section>
      </main>
      <Snackbar message="Producto añadido al carrito" tone="success" />
      <BottomNavigation active="home" onNavigate={noop} />
    </AppShell>
  );
}
