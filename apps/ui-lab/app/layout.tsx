import type { Metadata, Viewport } from 'next';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '../../../packages/design-tokens/src/tokens.css';
import '../../../packages/ui/src/styles.css';
import '../../../packages/ui/src/accessibility.css';

export const metadata: Metadata = {
  title: 'HIELYA UI Lab — C-005 Home',
  description: 'Executable code-first reconstruction of HIELYA C-005 Home Master Screen.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
