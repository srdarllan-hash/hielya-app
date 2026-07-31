import type { Preview } from '@storybook/react';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@hielya/design-tokens/tokens.css';
import '@hielya/ui/styles.css';
import '@hielya/ui/accessibility.css';
import { tokens } from '@hielya/design-tokens/tokens';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'HIELYA Black',
      values: [{ name: 'HIELYA Black', value: tokens['color.background.primary'] }],
    },
    a11y: { test: 'error' },
  },
};

export default preview;
