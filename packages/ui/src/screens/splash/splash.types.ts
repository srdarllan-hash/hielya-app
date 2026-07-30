export const splashStates = [
  'initial',
  'loading',
  'transition',
  'offline',
  'error',
  'timeout',
  'maintenance',
  'ready-location',
  'ready-home',
  'reduced-motion',
] as const;

export type SplashState = (typeof splashStates)[number];
export type SplashNextScreen = 'C-002' | 'C-005' | null;
export type SplashLocale = 'es' | 'en' | 'pt';

export function coerceSplashState(value?: string): SplashState {
  return splashStates.includes(value as SplashState) ? (value as SplashState) : 'loading';
}

export function coerceSplashLocale(value?: string): SplashLocale {
  return value === 'en' || value === 'pt' ? value : 'es';
}

export function nextScreenForSplashState(state: SplashState): SplashNextScreen {
  if (state === 'ready-location') return 'C-002';
  if (state === 'ready-home') return 'C-005';
  return null;
}
