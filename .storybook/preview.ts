import type { Preview } from '@storybook/react';
import '../packages/design-tokens/src/tokens.css';
import '../packages/ui/src/styles.css';
import '../packages/ui/src/accessibility.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'HIELYA Black',
      values: [{ name: 'HIELYA Black', value: '#000000' }],
    },
    a11y: { test: 'error' },
  },
};

export default preview;
