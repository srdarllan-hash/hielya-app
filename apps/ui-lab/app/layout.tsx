import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '../src/client/auth/AuthProvider';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@hielya/design-tokens/tokens.css';
import '@hielya/ui/styles.css';
import '@hielya/ui/accessibility.css';
import { tokens } from '@hielya/design-tokens/tokens';

export const metadata: Metadata = {
  title: 'HIELYA UI Lab — Certified screens',
  description: 'Executable code-first HIELYA interface and architecture laboratory.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: tokens['color.background.primary'],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
