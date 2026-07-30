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
import { IconButton } from '../../components/IconButton';
import { BottomNavigation } from '../../components/BottomNavigation';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { Snackbar } from '../../components/Snackbar';
import { DeliveryQuoteCard } from '../../components/DeliveryQuoteCard';
import { asset } from '../../lib/assets';

export function ComponentGallery() {
  return (
    <AppShell state="component-gallery">
      <AppHeader cartCount={3} />
      <main id="main-content" className="hly-component-gallery">
        <h1>Componentes canónicos · Batch 01</h1>
        <p>Variantes executáveis ligadas aos Design Tokens 1.1.0.</p>
        <section>
          <SectionHeader title="Entrega e busca" action="" />
          <DeliveryQuoteCard />
          <SearchField />
        </section>
        <section>
          <SectionHeader title="Categorias" action="" />
          <div className="hly-categories">
            <CategoryChip label="Cervezas" image={asset('categories/victoria.svg')} active />
            <CategoryChip label="Hielo" image={asset('categories/ice-bag.svg')} />
            <CategoryChip label="Snacks" image={asset('categories/lays.svg')} disabled />
          </div>
        </section>
        <section>
          <SectionHeader title="Hero" action="" />
          <HeroBanner image={asset('hero/cold-beer-hero.svg')} />
        </section>
        <section>
          <SectionHeader title="Commerce" action="" />
          <div className="hly-product-grid">
            <ProductCard name="Victoria Málaga" size="330 ml" price="€1,40" image={asset('products/victoria.svg')} />
            <ProductCard name="Estrella Galicia" size="330 ml" price="€1,50" image={asset('products/estrella.svg')} lowStock />
            <ProductCard name="Red Bull" size="250 ml" price="€2,80" image={asset('products/redbull.svg')} unavailable />
          </div>
          <div className="hly-pack-grid hly-component-gallery__spacer">
            <PackCard
              name="Pack Cervecero"
              description={['12x Estrella Galicia 330 ml', 'Hielo en bolsa 2 kg']}
              price="€16,80"
              discount="−7%"
              image={asset('products/pack-cervecero.svg')}
            />
          </div>
        </section>
        <section>
          <SectionHeader title="Estados e acciones" action="" />
          <div className="hly-component-gallery__row">
            <StatusBadge tone="success">Disponible</StatusBadge>
            <StatusBadge tone="warning">Alta demanda</StatusBadge>
            <StatusBadge tone="danger">Bloqueado</StatusBadge>
            <IconButton icon="cart" label="Carrito" badge={3} />
          </div>
        </section>
        <section>
          <SectionHeader title="Feedback" action="" />
          <EmptyState title="Sin contenido" message="No hay elementos disponibles." action="Volver" />
          <ErrorState />
          <LoadingState />
        </section>
      </main>
      <Snackbar message="Producto añadido al carrito" tone="success" />
      <BottomNavigation active="Inicio" />
    </AppShell>
  );
}
