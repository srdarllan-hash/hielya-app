import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchField } from '../../packages/ui/src/components/SearchField';
import { ProductCard } from '../../packages/ui/src/components/ProductCard';
import { BottomNavigation } from '../../packages/ui/src/components/BottomNavigation';

describe('canonical component contracts', () => {
  it('names catalog search', () => {
    render(<SearchField />);
    expect(screen.getByRole('searchbox', { name: 'Busca productos, marcas o categorías' })).toBeInTheDocument();
  });

  it('blocks unavailable product', () => {
    render(
      <ProductCard
        name="Victoria Málaga"
        size="330 ml"
        price="€1,40"
        image="/assets/products/victoria.svg"
        unavailable
      />,
    );
    expect(screen.getByRole('button', { name: 'Victoria Málaga no disponible' })).toBeDisabled();
  });

  it('marks active navigation', () => {
    render(<BottomNavigation active="Inicio" />);
    expect(screen.getByRole('button', { name: /Inicio/ })).toHaveAttribute('aria-current', 'page');
  });
});
