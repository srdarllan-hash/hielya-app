import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SplashScreen } from '../../packages/ui/src/screens/splash/SplashScreen';
import {
  coerceSplashLocale,
  coerceSplashState,
  nextScreenForSplashState,
} from '../../packages/ui/src/screens/splash/splash.types';

describe('C-001 Splash contract', () => {
  it('renders the approved brand lockup and official Spanish tagline', () => {
    render(<SplashScreen state="loading" locale="es" />);
    expect(screen.getByRole('img', { name: 'HIELYA, Lo quieres frío. Lo quieres ya.' })).toBeInTheDocument();
    expect(screen.getByText('Lo quieres frío. Lo quieres ya.')).toBeInTheDocument();
  });

  it('marks bootstrap states as busy', () => {
    const { container } = render(<SplashScreen state="loading" />);
    expect(container.querySelector('[data-screen-id="C-001"]')).toHaveAttribute('aria-busy', 'true');
  });

  it('contracts first access to C-002 without rendering C-002', () => {
    const { container } = render(<SplashScreen state="ready-location" />);
    const splash = container.querySelector('[data-screen-id="C-001"]');
    expect(splash).toHaveAttribute('data-next-screen', 'C-002');
    expect(container.querySelector('[data-screen-id="C-002"]')).not.toBeInTheDocument();
  });

  it('contracts returning context to C-005', () => {
    const { container } = render(<SplashScreen state="ready-home" />);
    expect(container.querySelector('[data-screen-id="C-001"]')).toHaveAttribute('data-next-screen', 'C-005');
  });

  it('never routes Splash to phone login or OTP', () => {
    expect(nextScreenForSplashState('ready-location')).toBe('C-002');
    expect(nextScreenForSplashState('ready-home')).toBe('C-005');
    expect(nextScreenForSplashState('loading')).toBeNull();
  });

  it.each(['offline', 'error', 'timeout'] as const)('provides controlled recovery for %s', (state) => {
    const onRetry = vi.fn();
    render(<SplashScreen state={state} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses Spanish as the documented fallback', () => {
    expect(coerceSplashLocale('fr')).toBe('es');
    expect(coerceSplashState('unknown')).toBe('loading');
  });

  it('does not expose a timer or duration prop', () => {
    const { container } = render(<SplashScreen state="initial" />);
    expect(container.querySelector('[data-duration]')).not.toBeInTheDocument();
  });
});
