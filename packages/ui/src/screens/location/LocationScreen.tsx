'use client';

import React from 'react';
import {
  canContinueWithLocation,
  type LocationDependencies,
  type LocationLocale,
  type LocationState,
} from '@hielya/location';
import { AppShell } from '../../components/AppShell';
import { BrandLockup } from '../../components/BrandLockup';
import { Button } from '../../components/Button';
import { FeedbackState } from '../../components/FeedbackState';
import { Icon } from '../../icons/Icon';
import { AddressConfirmationCard } from './AddressConfirmationCard';
import { ManualAddressForm } from './ManualAddressForm';
import { getLocationCopy } from './location.copy';
import type { LocationDemoVariant, LocationDriver, LocationScenario } from './location.types';
import { useLocationController } from './useLocationController';
import styles from './LocationScreen.module.css';

export interface LocationScreenProps {
  locale?: LocationLocale;
  initialState?: LocationState;
  driver?: LocationDriver;
  scenario?: LocationScenario;
  demoVariant?: LocationDemoVariant;
  dependencies?: LocationDependencies;
  lockServiceAreaNavigation?: boolean;
}

const loadingStates = new Set<LocationState>([
  'requesting_permission', 'locating', 'reverse_geocoding', 'validating_manual_address', 'checking_service_area', 'retrying',
]);

const feedbackVariant = (state: LocationState) => state === 'offline' ? 'offline' as const
  : state === 'timeout' ? 'timeout' as const
    : state === 'success' ? 'success' as const
      : state === 'out_of_area' || state === 'invalid_address' || state === 'permission_denied' || state === 'location_unavailable' || state === 'network_error'
        ? 'error' as const
        : null;

export function LocationScreen({
  locale = 'es',
  initialState = 'idle',
  driver = 'fake',
  scenario = 'serviceable',
  demoVariant = 'default',
  dependencies,
  lockServiceAreaNavigation = false,
}: LocationScreenProps) {
  const copy = getLocationCopy(locale);
  const { context, dispatch, dependencies: runtime } = useLocationController({
    dependencies,
    locale,
    initialState,
    demoVariant,
    geolocationMode: driver,
    geolocationScenario: scenario === 'permission_denied' ? 'denied' : scenario === 'location_unavailable' ? 'unavailable' : scenario === 'timeout' ? 'timeout' : 'granted',
    networkScenario: scenario === 'network_error' ? 'network_error' : scenario === 'timeout' ? 'timeout' : 'success',
    serviceAreaScenario: scenario === 'out_of_area' ? 'out_of_area' : scenario === 'network_error' ? 'network_error' : scenario === 'timeout' ? 'timeout' : 'serviceable',
  });
  const state = context.state;
  const loading = loadingStates.has(state);
  const variant = feedbackVariant(state);
  const manual = state === 'manual_entry' || state === 'validating_manual_address' || state === 'invalid_address';
  const selected = state === 'resolved' || state === 'checking_service_area' || state === 'success';
  const canContinue = canContinueWithLocation(context.confirmed);
  const serviceAreaNavigationLocked = lockServiceAreaNavigation && (
    state === 'checking_service_area'
    || (state === 'retrying' && context.lastOperation === 'service_area')
  );

  const errorActions = {
    primaryAction: state === 'permission_denied'
      ? { label: copy.enterManually, onAction: () => void dispatch({ type: 'ENTER_MANUALLY' }) }
      : state === 'out_of_area' || state === 'invalid_address'
        ? { label: copy.edit, onAction: () => void dispatch({ type: 'EDIT_ADDRESS' }) }
        : { label: copy.retry, onAction: () => void dispatch({ type: 'RETRY' }), icon: 'refresh' as const },
    secondaryAction: state === 'permission_denied' || state === 'out_of_area' || state === 'invalid_address'
      ? undefined
      : { label: copy.enterManually, onAction: () => void dispatch({ type: 'ENTER_MANUALLY' }) },
  };

  return (
    <AppShell screenState={`location-${state}`}>
      <main
        className={styles.screen}
        data-screen-id="C-002"
        data-state={state}
        data-outcome-emitted={context.completionEmitted || undefined}
        lang={locale}
      >
        <header className={styles.header}>
          <BrandLockup size="sm" showTagline={false} />
          <span className={styles.step}>C-002 · Localización</span>
        </header>

        <section className={styles.intro} aria-labelledby="location-title">
          <span className={styles.introIcon} aria-hidden="true"><Icon name="location" size={32} /></span>
          <div>
            <h1 id="location-title">{copy.title}</h1>
            <p>{copy.intro}</p>
          </div>
        </section>

        {state === 'idle' ? (
          <section className={styles.choice} aria-label={copy.stateTitle.idle}>
            <p>{copy.stateMessage.idle}</p>
            <Button fullWidth size="lg" leadingIcon="location" onClick={() => void dispatch({ type: 'USE_CURRENT_LOCATION' })}>
              {copy.useCurrentLocation}
            </Button>
            <Button fullWidth size="lg" variant="secondary" onClick={() => void dispatch({ type: 'ENTER_MANUALLY' })}>
              {copy.enterManually}
            </Button>
          </section>
        ) : null}

        {loading ? (
          <section className={styles.status} role="status" aria-live="polite" aria-busy="true">
            <span className={styles.spinner} aria-hidden="true" />
            <h2>{copy.stateTitle[state]}</h2>
            <p>{copy.stateMessage[state]}</p>
            {state !== 'requesting_permission' ? (
              <Button
                variant="ghost"
                disabled={serviceAreaNavigationLocked}
                onClick={() => void dispatch({ type: 'ENTER_MANUALLY' })}
              >
                {copy.enterManually}
              </Button>
            ) : null}
          </section>
        ) : null}

        {manual ? (
          <section className={styles.panel} aria-labelledby="manual-address-title">
            <h2 id="manual-address-title">{copy.stateTitle.manual_entry}</h2>
            <p>{copy.stateMessage.manual_entry}</p>
            <ManualAddressForm
              query={context.manualInput.query}
              suggestions={context.suggestions}
              loading={state === 'validating_manual_address'}
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              searchLabel={copy.search}
              suggestionLabel={copy.suggestionLabel}
              useCurrentLocationLabel={copy.useCurrentLocation}
              errorMessage={state === 'invalid_address' ? copy.stateMessage.invalid_address : undefined}
              onQueryChange={(query) => void dispatch({ type: 'ADDRESS_QUERY_CHANGED', query })}
              onSearch={() => void dispatch({ type: 'SEARCH_ADDRESS' })}
              onSelect={(suggestion) => void dispatch({ type: 'SELECT_SUGGESTION', suggestion })}
              onUseCurrentLocation={() => void dispatch({ type: 'USE_CURRENT_LOCATION' })}
            />
          </section>
        ) : null}

        {selected && context.candidate ? (
          <section className={styles.panel} aria-labelledby="confirm-address-title">
            <h2 id="confirm-address-title">{state === 'success' ? copy.stateTitle.success : copy.confirmTitle}</h2>
            <p>{state === 'success' ? copy.stateMessage.success : copy.stateMessage.resolved}</p>
            <AddressConfirmationCard
              location={context.candidate}
              kindLabel={copy.kind[context.candidate.address.kind] ?? copy.kind.unknown}
            />
            <div className={styles.actions}>
              {state === 'success' ? (
                <Button
                  fullWidth
                  size="lg"
                  leadingIcon="arrow-right"
                  disabled={!canContinue}
                  onClick={() => void dispatch({ type: 'CONTINUE' })}
                >
                  {copy.continue}
                </Button>
              ) : (
                <Button fullWidth size="lg" loading={state === 'checking_service_area'} onClick={() => void dispatch({ type: 'CONFIRM_ADDRESS' })}>
                  {copy.confirm}
                </Button>
              )}
              <Button fullWidth variant="secondary" disabled={state === 'checking_service_area'} onClick={() => void dispatch({ type: 'EDIT_ADDRESS' })}>
                {copy.edit}
              </Button>
            </div>
          </section>
        ) : null}

        {variant && state !== 'success' && !manual ? (
          <FeedbackState
            variant={variant}
            title={copy.stateTitle[state]}
            message={copy.stateMessage[state]}
            className={styles.feedback}
            {...errorActions}
          />
        ) : null}

        <p className={styles.privacy}>{runtime.policies.privacyCopy || copy.privacy}</p>
      </main>
    </AppShell>
  );
}
