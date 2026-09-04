import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeSuggestions } from '@hielya/location';
import { Button } from '../../packages/ui/src/components/Button';
import { ManualAddressForm } from '../../packages/ui/src/screens/location/ManualAddressForm';
import { LocationScreen } from '../../packages/ui/src/screens/location/LocationScreen';

afterEach(cleanup);

describe('C-002 UI contracts', () => {
  it('Button exposes loading and disabled states', () => {
    render(<Button loading>Comprobando</Button>);
    const button = screen.getByRole('button', { name: 'Comprobando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('ManualAddressForm reports query changes and searches', () => {
    const onQueryChange = vi.fn();
    const onSearch = vi.fn();
    render(
      <ManualAddressForm
        query="Paseo"
        suggestions={[]}
        label="Dirección"
        placeholder="Calle"
        searchLabel="Buscar"
        suggestionLabel="Sugerencias"
        useCurrentLocationLabel="Usar ubicación"
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        onSelect={vi.fn()}
        onUseCurrentLocation={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Hotel' } });
    expect(onQueryChange).toHaveBeenCalledWith('Hotel');
    fireEvent.submit(screen.getByRole('combobox').closest('form')!);
    expect(onSearch).toHaveBeenCalled();
  });

  it('ManualAddressForm supports keyboard selection', () => {
    const onSelect = vi.fn();
    render(
      <ManualAddressForm
        query="Paseo"
        suggestions={fakeSuggestions.slice(0, 2)}
        label="Dirección"
        placeholder="Calle"
        searchLabel="Buscar"
        suggestionLabel="Sugerencias"
        useCurrentLocationLabel="Usar ubicación"
        onQueryChange={vi.fn()}
        onSearch={vi.fn()}
        onSelect={onSelect}
        onUseCurrentLocation={vi.fn()}
      />,
    );
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(fakeSuggestions[0]);
  });

  it('renders every blocking feedback state without direct navigation', () => {
    render(<LocationScreen initialState="permission_denied" driver="fake" />);
    expect(screen.getByRole('heading', { name: 'Permiso no concedido' })).toBeInTheDocument();
    expect(document.querySelector('[data-next-screen]')).toBeNull();
  });

  it('completes the fake manual flow and emits the typed outcome event', async () => {
    const listener = vi.fn();
    window.addEventListener('hielya:location-outcome', listener);
    render(<LocationScreen initialState="idle" driver="fake" scenario="serviceable" />);
    fireEvent.click(screen.getByRole('button', { name: 'Introducir dirección' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Paseo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar dirección' }));
    await waitFor(() => expect(screen.getByText('Paseo Marítimo Rey de España, 65')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Paseo Marítimo Rey de España, 65'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar dirección' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar dirección' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() => expect(listener).toHaveBeenCalled());
    const event = listener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail.type).toBe('LOCATION_CONFIRMED');
    window.removeEventListener('hielya:location-outcome', listener);
  });

  it('keeps the controller active across Strict Mode effect remounts', () => {
    render(
      <React.StrictMode>
        <LocationScreen initialState="idle" driver="fake" scenario="serviceable" />
      </React.StrictMode>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Introducir dirección' }));
    expect(screen.getByRole('combobox', { name: 'Dirección de entrega' })).toBeInTheDocument();
  });
});
