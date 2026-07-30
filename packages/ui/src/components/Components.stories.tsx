import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';
import { asset } from '../lib/assets';

const meta = {
  title: 'Commerce/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: {
    name: 'Victoria Málaga',
    size: '330 ml',
    price: '€1,40',
    image: asset('products/victoria.svg'),
  },
};
export const LowStock: Story = { args: { ...Available.args!, lowStock: true } };
export const Unavailable: Story = { args: { ...Available.args!, unavailable: true } };
