'use client';

import React from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppShell } from '../../components/AppShell';
import { getSplashCopy } from './splash.copy';
import {
  nextScreenForSplashState,
  type SplashLocale,
  type SplashNextScreen,
  type SplashState,
} from './splash.types';
import styles from './SplashScreen.module.css';

export interface SplashScreenProps {
  state?: SplashState;
  locale?: SplashLocale;
  nextScreen?: SplashNextScreen;
  onRetry?: () => void;
}

const recoveryStates = new Set<SplashState>(['offline', 'error', 'timeout']);
const busyStates = new Set<SplashState>(['initial', 'loading', 'reduced-motion']);
const completedStates = new Set<SplashState>(['transition', 'ready-location', 'ready-home']);

export function SplashScreen({
  state = 'loading',
  locale = 'es',
  nextScreen,
  onRetry,
}: SplashScreenProps) {
  const copy = getSplashCopy(locale);
  const destination = nextScreen ?? nextScreenForSplashState(state);
  const isRecovery = recoveryStates.has(state);
  const isBusy = busyStates.has(state);
  const isComplete = completedStates.has(state);
  const isAnimated = (state === 'initial' || state === 'loading') && state !== 'reduced-motion';
  const statusRole = isRecovery ? 'alert' : 'status';

  const retry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <AppShell state={`splash-${state}`}>
      <main
        className={styles.splash}
        data-screen-id="C-001"
        data-state={state}
        data-next-screen={destination ?? ''}
        data-recovery={isRecovery || undefined}
        aria-busy={isBusy || undefined}
        lang={locale}
      >
        <div className={styles.brand} role="img" aria-label={copy.brandLabel}>
          <div aria-hidden="true">
            <AppHeader />
          </div>
          <p className={styles.tagline}>{copy.tagline}</p>
        </div>

        <div className={styles.statusArea}>
          <span
            className={styles.indicator}
            data-animated={isAnimated || undefined}
            data-complete={isComplete || undefined}
            aria-hidden="true"
          />

          {isRecovery ? (
            <div className={styles.recovery} role={statusRole} aria-live="assertive">
              <h1 className={styles.recoveryTitle}>{copy.title[state]}</h1>
              <p className={styles.recoveryMessage}>{copy.message[state]}</p>
              <button className={styles.retry} type="button" onClick={retry}>
                {copy.retry}
              </button>
            </div>
          ) : (
            <p className={styles.status} role={statusRole} aria-live="polite">
              {copy.status[state]}
            </p>
          )}

          {destination ? (
            <span className="hly-visually-hidden">
              {destination === 'C-002' ? 'C-002 Location and service area' : 'C-005 Home'}
            </span>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
