import type { Metadata } from 'next';
import {
  SplashScreen,
  coerceSplashLocale,
  coerceSplashState,
  nextScreenForSplashState,
  type SplashNextScreen,
} from '@hielya/ui';

export const metadata: Metadata = {
  title: 'HIELYA — Splash',
  description: 'C-001 Splash and PWA bootstrap contract.',
};

export default async function SplashPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; locale?: string; next?: string }>;
}) {
  const params = await searchParams;
  const state = coerceSplashState(params.state);
  const locale = coerceSplashLocale(params.locale);
  const explicitNext: SplashNextScreen =
    params.next === 'C-002' || params.next === 'C-005' ? params.next : null;
  const nextScreen = explicitNext ?? nextScreenForSplashState(state);

  return <SplashScreen state={state} locale={locale} nextScreen={nextScreen} />;
}
