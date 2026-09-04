import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AppShell } from './AppShell';
import { AppHeader } from './AppHeader';
import { BrandLockup } from './BrandLockup';
import { SearchField } from './SearchField';
import { CategoryChip } from './CategoryChip';
import { HeroBanner } from './HeroBanner';
import { SectionHeader } from './SectionHeader';
import { ProductCard } from './ProductCard';
import { PackCard } from './PackCard';
import { StatusBadge } from './StatusBadge';
import { IconButton } from './IconButton';
import { BottomNavigation } from './BottomNavigation';
import { HomeLoadingState } from './HomeLoadingState';
import { FeedbackState } from './FeedbackState';
import { Snackbar } from './Snackbar';
import { DeliveryQuoteCard } from './DeliveryQuoteCard';
import { ComponentGallery } from '../screens/lab/ComponentGallery';
import { asset } from '../lib/assets';

const noop = () => undefined;
const frame = (child: React.ReactNode) => <div className="hly-story-frame">{child}</div>;

const meta = {
  title: 'Foundation/Canonical Components',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = { render: () => <ComponentGallery /> };
export const AppShellDefault: Story = { render: () => <AppShell screenState="story">{frame(<p>Contenido de la aplicación</p>)}</AppShell> };
export const BrandLockupVariants: Story = { render: () => frame(<div className="hly-component-gallery__row"><BrandLockup size="sm" showTagline={false} /><BrandLockup size="md" /><BrandLockup size="lg" align="center" /></div>) };
export const AppHeaderVariants: Story = { render: () => frame(<><AppHeader cartCount={3} onProfile={noop} onCart={noop} /><AppHeader variant="internal" onProfile={noop} onCart={noop} /></>) };
export const DeliveryQuoteCardDefault: Story = { render: () => frame(<DeliveryQuoteCard onChangeAddress={noop} />) };
export const SearchFieldStates: Story = { render: () => frame(<><SearchField onSubmit={noop} onFilter={noop} /><SearchField loading onSubmit={noop} onFilter={noop} /></>) };
export const CategoryChipStates: Story = { render: () => frame(<div className="hly-component-gallery__row"><CategoryChip label="Cervezas" image={asset('categories/victoria.svg')} active onSelect={noop} /><CategoryChip label="Hielo" image={asset('categories/ice-bag.svg')} onSelect={noop} /><CategoryChip label="Snacks" image={asset('categories/lays.svg')} disabled onSelect={noop} /></div>) };
export const HeroBannerDefault: Story = { render: () => frame(<HeroBanner image={asset('hero/cold-beer-hero.svg')} />) };
export const SectionHeaderStates: Story = { render: () => frame(<><SectionHeader title="Más vendidos" action="Ver todos" onAction={noop} /><SectionHeader title="Sin acción" /></>) };
export const ProductCardStates: Story = { render: () => frame(<div className="hly-product-grid"><ProductCard name="Victoria Málaga" size="330 ml" price="€1,40" image={asset('products/victoria.svg')} onAdd={noop} /><ProductCard name="Estrella Galicia" size="330 ml" price="€1,50" image={asset('products/estrella.svg')} lowStock onAdd={noop} /><ProductCard name="Red Bull" size="250 ml" price="€2,80" image={asset('products/redbull.svg')} unavailable onAdd={noop} /></div>) };
export const PackCardStates: Story = { render: () => frame(<PackCard name="Pack Cervecero" description={['12x Estrella Galicia 330 ml', 'Hielo en bolsa 2 kg']} price="€16,80" discount="−7%" image={asset('products/pack-cervecero.svg')} onAdd={noop} />) };
export const StatusBadgeTones: Story = { render: () => frame(<div className="hly-component-gallery__row"><StatusBadge tone="success">Disponible</StatusBadge><StatusBadge tone="warning">Alta demanda</StatusBadge><StatusBadge tone="danger">Bloqueado</StatusBadge><StatusBadge tone="info">Información</StatusBadge></div>) };
export const IconButtonStates: Story = { render: () => frame(<div className="hly-component-gallery__row"><IconButton icon="user" label="Perfil" onClick={noop} /><IconButton icon="cart" label="Carrito" badge={3} onClick={noop} /><IconButton icon="cart" label="Carrito deshabilitado" disabled /></div>) };
export const BottomNavigationDefault: Story = { render: () => frame(<BottomNavigation active="home" onNavigate={noop} />) };
export const FeedbackVariants: Story = { render: () => frame(<><FeedbackState variant="empty" title="Sin contenido" message="No hay elementos disponibles." primaryAction={{ label: 'Volver', onAction: noop }} /><FeedbackState variant="offline" title="Sin conexión" message="Comprueba tu conexión." primaryAction={{ label: 'Reintentar', onAction: noop, icon: 'refresh' }} /><FeedbackState variant="success" title="Listo" message="La operación se completó." /></>) };
export const HomeLoadingSkeleton: Story = { render: () => frame(<HomeLoadingState />) };
export const SnackbarSuccess: Story = { render: () => frame(<Snackbar message="Producto añadido al carrito" tone="success" />) };
