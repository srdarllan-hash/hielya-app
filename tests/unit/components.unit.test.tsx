import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell, BrandLockup, AppHeader, FeedbackState, SearchField, CategoryChip, ProductCard, PackCard, SectionHeader, DeliveryQuoteCard, BottomNavigation } from '@hielya/ui';

afterEach(() => cleanup());

describe('canonical architecture component contracts', () => {
  it('exposes a generic screen state without Home coupling', () => {
    const { container } = render(<AppShell screenState="loading">content</AppShell>);
    expect(container.firstElementChild).toHaveAttribute('data-screen-state', 'loading');
    expect(container.firstElementChild?.getAttributeNames()).not.toContain(['data', 'home', 'state'].join('-'));
  });

  it('renders BrandLockup variants with one accessible brand name', () => {
    render(<BrandLockup size="lg" align="center" />);
    expect(screen.getByRole('img', { name: 'HIELYA, Lo quieres frío. Lo quieres ya.' })).toBeInTheDocument();
  });

  it('composes BrandLockup inside AppHeader and invokes actions', () => {
    const onProfile = vi.fn();
    const onCart = vi.fn();
    render(<AppHeader cartCount={2} onProfile={onProfile} onCart={onCart} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir perfil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir carrito' }));
    expect(onProfile).toHaveBeenCalledOnce();
    expect(onCart).toHaveBeenCalledOnce();
  });

  it('keeps actionless header controls disabled', () => {
    render(<AppHeader />);
    expect(screen.getByRole('button', { name: 'Abrir perfil' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Abrir carrito' })).toBeDisabled();
  });

  it('supports controlled search, submit and filter callbacks', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onFilter = vi.fn();
    render(<SearchField value="hielo" onChange={onChange} onSubmit={onSubmit} onFilter={onFilter} />);
    const input = screen.getByRole('searchbox', { name: 'Busca productos, marcas o categorías' });
    fireEvent.change(input, { target: { value: 'agua' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros' }));
    expect(onChange).toHaveBeenCalledWith('agua');
    expect(onSubmit).toHaveBeenCalledWith('hielo');
    expect(onFilter).toHaveBeenCalledOnce();
  });

  it('selects a category with its typed value', () => {
    const onSelect = vi.fn();
    render(<CategoryChip label="Hielo" value="ice" image="/assets/shared/ice-bag.svg" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hielo' }));
    expect(onSelect).toHaveBeenCalledWith('ice');
  });

  it('adds a product and blocks unavailable products', () => {
    const onAdd = vi.fn();
    const { rerender } = render(<ProductCard productId="victoria" name="Victoria Málaga" size="330 ml" price="€1,40" image="/assets/shared/victoria.svg" onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Victoria Málaga al carrito' }));
    expect(onAdd).toHaveBeenCalledWith('victoria');
    rerender(<ProductCard productId="victoria" name="Victoria Málaga" size="330 ml" price="€1,40" image="/assets/shared/victoria.svg" unavailable onAdd={onAdd} />);
    expect(screen.getByRole('button', { name: 'Victoria Málaga no disponible' })).toBeDisabled();
  });

  it('adds a pack through a typed callback', () => {
    const onAdd = vi.fn();
    render(<PackCard packId="party" name="Pack Cervecero" description={['12 unidades']} price="€16,80" discount="−7%" image="/assets/products/pack-cervecero.svg" onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Pack Cervecero al carrito' }));
    expect(onAdd).toHaveBeenCalledWith('party');
  });

  it('only renders a section action when a callback exists', () => {
    const onAction = vi.fn();
    const { rerender } = render(<SectionHeader title="Productos" action="Ver todos" />);
    expect(screen.queryByRole('button', { name: 'Ver todos' })).not.toBeInTheDocument();
    rerender(<SectionHeader title="Productos" action="Ver todos" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('changes delivery address through an explicit callback', () => {
    const onChangeAddress = vi.fn();
    render(<DeliveryQuoteCard onChangeAddress={onChangeAddress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar dirección de entrega' }));
    expect(onChangeAddress).toHaveBeenCalledOnce();
  });

  it('navigates with a typed navigation item', () => {
    const onNavigate = vi.fn();
    render(<BottomNavigation active="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Categorías/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'categories' }));
    expect(screen.getByRole('button', { name: /Inicio/ })).toHaveAttribute('aria-current', 'page');
  });

  it('consolidates feedback actions and loading state', () => {
    const onAction = vi.fn();
    const { rerender } = render(<FeedbackState variant="offline" title="Sin conexión" message="Comprueba tu red." primaryAction={{ label: 'Reintentar', onAction }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onAction).toHaveBeenCalledOnce();
    rerender(<FeedbackState variant="offline" title="Sin conexión" message="Comprueba tu red." loading primaryAction={{ label: 'Reintentar', onAction }} />);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeDisabled();
  });
});
