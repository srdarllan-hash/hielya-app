import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LocationPage from '../../apps/ui-lab/app/location/page';
import {
  DeliveryQuoteClientError,
  type MvpDeliveryQuoteClient,
} from '../../apps/ui-lab/src/client/mvp-local-36/delivery-quote-client';
import { DeliveryQuoteServiceAreaAdapter } from '../../apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter';
import {
  LocationRuntime,
  createMvpLocationRuntimeDependencies,
} from '../../apps/ui-lab/src/client/mvp-local-36/LocationRuntime';
import {
  FakeAddressSearchService,
  FakeAddressValidationService,
  FakeReverseGeocodingService,
} from '@hielya/location';
import { LocationScreen } from '@hielya/ui';

const CORRELATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SESSION_KEY = 'hielya.location.confirmed.v1';

const successfulClient = (): MvpDeliveryQuoteClient => ({
  quoteDelivery: vi.fn(async () => ({
    data: {
      withinArea: true,
      routeDistanceKm: 2.5,
      feeCents: 350,
    },
    correlationId: CORRELATION_ID,
  })),
});

const completeManualAddress = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Introducir dirección' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Dirección de entrega' }), {
    target: { value: 'Paseo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar dirección' }));
  fireEvent.click(await screen.findByText('Paseo Marítimo Rey de España, 65'));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar dirección' }));
};

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('C-002 location route boundary', () => {
  it('uses the HTTP runtime when no demo driver is requested', async () => {
    const element = await LocationPage({ searchParams: Promise.resolve({}) });

    expect(element.type).toBe(LocationRuntime);
    expect((element as React.ReactElement<{ locale: string }>).props.locale).toBe('es');
  });

  it('uses the HTTP runtime for an explicit browser driver', async () => {
    const element = await LocationPage({
      searchParams: Promise.resolve({ driver: 'browser', locale: 'pt' }),
    });

    expect(element.type).toBe(LocationRuntime);
    expect((element as React.ReactElement<{ locale: string }>).props.locale).toBe('pt');
  });

  it('preserves the frozen synthetic path only for explicit driver=fake', async () => {
    const element = await LocationPage({
      searchParams: Promise.resolve({
        driver: 'fake',
        state: 'resolved',
        scenario: 'out_of_area',
        variant: 'long_address',
        locale: 'en',
      }),
    });
    const props = (element as React.ReactElement<{
      driver: string;
      initialState: string;
      scenario: string;
      demoVariant: string;
      locale: string;
    }>).props;

    expect(element.type).toBe(LocationScreen);
    expect(props).toEqual({
      initialState: 'resolved',
      driver: 'fake',
      scenario: 'out_of_area',
      demoVariant: 'long_address',
      locale: 'en',
    });
  });

  it('replaces only FakeServiceAreaService while real geocoding is out of scope', () => {
    const dependencies = createMvpLocationRuntimeDependencies({
      client: successfulClient(),
    });

    expect(dependencies.serviceArea).toBeInstanceOf(DeliveryQuoteServiceAreaAdapter);
    expect(dependencies.reverseGeocoding).toBeInstanceOf(FakeReverseGeocodingService);
    expect(dependencies.addressSearch).toBeInstanceOf(FakeAddressSearchService);
    expect(dependencies.addressValidation).toBeInstanceOf(FakeAddressValidationService);
  });
});

describe('C-002 public delivery-quote runtime', () => {
  it('renders and persists only the server distance and fee', async () => {
    const client = successfulClient();
    render(<LocationRuntime client={client} />);

    await completeManualAddress();

    expect(await screen.findByRole('heading', { name: 'Dirección confirmada' }))
      .toBeInTheDocument();
    expect(screen.getByText('2.5 km')).toBeInTheDocument();
    expect(screen.getByText('€3.50')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    expect(client.quoteDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      }),
      {
        signal: expect.any(AbortSignal),
        timeoutMs: 8_000,
      },
    );

    await waitFor(() => expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull());
    const stored = JSON.parse(String(sessionStorage.getItem(SESSION_KEY)));
    expect(stored.value).toMatchObject({
      deliveryQuoteId: null,
      serviceArea: {
        distanceMeters: 2_500,
        radiusMeters: null,
        deliveryFeeCents: 350,
        quoteId: null,
      },
    });
    expect(JSON.stringify(stored)).not.toContain(CORRELATION_ID);
  });

  it('disables navigation away from an in-flight service-area check', async () => {
    const client: MvpDeliveryQuoteClient = {
      quoteDelivery: vi.fn(() => new Promise<never>(() => undefined)),
    };
    render(<LocationRuntime client={client} />);

    await completeManualAddress();

    expect(await screen.findByRole('heading', { name: 'Comprobando cobertura' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Introducir dirección' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Editar dirección' })).toBeDisabled();
  });

  it('keeps navigation disabled while a retrying service-area request is in flight', async () => {
    let calls = 0;
    const client: MvpDeliveryQuoteClient = {
      quoteDelivery: vi.fn(() => {
        calls += 1;
        if (calls === 1) {
          return Promise.reject(new DeliveryQuoteClientError(
            'HTTP_ERROR',
            'Safe configuration error',
            {
              status: 400,
              publicError: {
                code: 'CONFIGURATION_UNAVAILABLE',
                message: 'Safe configuration error',
                correlationId: CORRELATION_ID,
              },
            },
          ));
        }
        return new Promise<never>(() => undefined);
      }),
    };
    render(<LocationRuntime client={client} />);
    await completeManualAddress();
    fireEvent.click(await screen.findByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByRole('heading', { name: 'Intentándolo de nuevo' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Introducir dirección' })).toBeDisabled();
  });

  it('shows a retryable safe error and does not persist a failed quote', async () => {
    const client: MvpDeliveryQuoteClient = {
      quoteDelivery: vi.fn(async () => {
        throw new DeliveryQuoteClientError(
          'HTTP_ERROR',
          'Internal database path',
          {
            status: 400,
            correlationId: CORRELATION_ID,
            publicError: {
              code: 'CONFIGURATION_UNAVAILABLE',
              message: 'Internal database path',
              correlationId: CORRELATION_ID,
            },
          },
        );
      }),
    };
    render(<LocationRuntime client={client} />);

    await completeManualAddress();

    expect(await screen.findByRole('heading', { name: 'No pudimos validar la dirección' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/database|internal/i);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
