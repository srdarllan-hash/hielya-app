import type { Meta, StoryObj } from '@storybook/react';
import { SplashScreen } from './SplashScreen';

const meta = {
  title: 'Screens/C-001 Splash',
  component: SplashScreen,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof SplashScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = { args: { state: 'initial', locale: 'es' } };
export const Loading: Story = { args: { state: 'loading', locale: 'es' } };
export const TransitionToLocation: Story = {
  args: { state: 'transition', locale: 'es', nextScreen: 'C-002' },
};
export const TransitionToHome: Story = {
  args: { state: 'transition', locale: 'es', nextScreen: 'C-005' },
};
export const Offline: Story = { args: { state: 'offline', locale: 'es' } };
export const Error: Story = { args: { state: 'error', locale: 'es' } };
export const Timeout: Story = { args: { state: 'timeout', locale: 'es' } };
export const Maintenance: Story = { args: { state: 'maintenance', locale: 'es' } };
export const ReadyLocation: Story = { args: { state: 'ready-location', locale: 'es' } };
export const ReadyHome: Story = { args: { state: 'ready-home', locale: 'es' } };
export const ReducedMotion: Story = { args: { state: 'reduced-motion', locale: 'es' } };
export const EnglishFallbackContract: Story = { args: { state: 'loading', locale: 'en' } };
export const PortugueseContract: Story = { args: { state: 'loading', locale: 'pt' } };
