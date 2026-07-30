import type { SplashLocale, SplashState } from './splash.types';

type SplashCopy = {
  brandLabel: string;
  tagline: string;
  status: Record<SplashState, string>;
  title: Partial<Record<SplashState, string>>;
  message: Partial<Record<SplashState, string>>;
  retry: string;
};

const copy: Record<SplashLocale, SplashCopy> = {
  es: {
    brandLabel: 'HIELYA, Lo quieres frío. Lo quieres ya.',
    tagline: 'Lo quieres frío. Lo quieres ya.',
    status: {
      initial: 'Preparando HIELYA',
      loading: 'Cargando HIELYA',
      transition: 'Todo listo',
      offline: 'Sin conexión',
      error: 'Algo salió mal',
      timeout: 'La carga está tardando más de lo esperado',
      maintenance: 'Mantenimiento',
      'ready-location': 'Continuar a ubicación',
      'ready-home': 'Continuar a inicio',
      'reduced-motion': 'Cargando HIELYA',
    },
    title: {
      offline: 'Sin conexión',
      error: 'Algo salió mal',
      timeout: 'La carga está tardando más de lo esperado',
      maintenance: 'Mantenimiento',
    },
    message: {
      offline: 'Revisa tu conexión e inténtalo de nuevo.',
      error: 'No pudimos iniciar HIELYA. Inténtalo de nuevo.',
      timeout: 'Puedes volver a intentarlo sin perder información.',
      maintenance: 'HIELYA no está disponible temporalmente.',
    },
    retry: 'Intentar de nuevo',
  },
  en: {
    brandLabel: 'HIELYA, You want it cold. You want it now.',
    tagline: 'You want it cold. You want it now.',
    status: {
      initial: 'Preparing HIELYA',
      loading: 'Loading HIELYA',
      transition: 'Ready',
      offline: 'No connection',
      error: 'Something went wrong',
      timeout: 'Loading is taking longer than expected',
      maintenance: 'Maintenance',
      'ready-location': 'Continue to location',
      'ready-home': 'Continue to home',
      'reduced-motion': 'Loading HIELYA',
    },
    title: {
      offline: 'No connection',
      error: 'Something went wrong',
      timeout: 'Loading is taking longer than expected',
      maintenance: 'Maintenance',
    },
    message: {
      offline: 'Check your connection and try again.',
      error: 'We could not start HIELYA. Try again.',
      timeout: 'You can try again without losing information.',
      maintenance: 'HIELYA is temporarily unavailable.',
    },
    retry: 'Try again',
  },
  pt: {
    brandLabel: 'HIELYA, Você quer gelado. Você quer agora.',
    tagline: 'Você quer gelado. Você quer agora.',
    status: {
      initial: 'Preparando a HIELYA',
      loading: 'Carregando a HIELYA',
      transition: 'Tudo pronto',
      offline: 'Sem conexão',
      error: 'Algo deu errado',
      timeout: 'O carregamento está demorando mais que o esperado',
      maintenance: 'Manutenção',
      'ready-location': 'Continuar para localização',
      'ready-home': 'Continuar para início',
      'reduced-motion': 'Carregando a HIELYA',
    },
    title: {
      offline: 'Sem conexão',
      error: 'Algo deu errado',
      timeout: 'O carregamento está demorando mais que o esperado',
      maintenance: 'Manutenção',
    },
    message: {
      offline: 'Verifique sua conexão e tente novamente.',
      error: 'Não foi possível iniciar a HIELYA. Tente novamente.',
      timeout: 'Você pode tentar novamente sem perder informações.',
      maintenance: 'A HIELYA está temporariamente indisponível.',
    },
    retry: 'Tentar novamente',
  },
};

export function getSplashCopy(locale: SplashLocale): SplashCopy {
  return copy[locale] ?? copy.es;
}
