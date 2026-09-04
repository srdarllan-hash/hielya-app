import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Foundation/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Continuar' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Introducir dirección' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Cancelar' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Eliminar' } };
export const Loading: Story = { args: { loading: true, children: 'Comprobando' } };
export const Disabled: Story = { args: { disabled: true } };
export const WithIcon: Story = { args: { leadingIcon: 'location', children: 'Usar mi ubicación' } };
export const FullWidth: Story = { args: { fullWidth: true } };
