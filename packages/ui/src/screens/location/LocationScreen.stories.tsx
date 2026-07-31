import type { Meta, StoryObj } from '@storybook/react';
import { LocationScreen } from './LocationScreen';

const meta = {
  title: 'Screens/C-002 Localización',
  component: LocationScreen,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { locale: 'es', driver: 'fake', scenario: 'serviceable' },
} satisfies Meta<typeof LocationScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { initialState: 'idle' } };
export const RequestingPermission: Story = { args: { initialState: 'requesting_permission' } };
export const Locating: Story = { args: { initialState: 'locating' } };
export const ManualEntry: Story = { args: { initialState: 'manual_entry' } };
export const Resolved: Story = { args: { initialState: 'resolved' } };
export const PermissionDenied: Story = { args: { initialState: 'permission_denied' } };
export const LocationUnavailable: Story = { args: { initialState: 'location_unavailable' } };
export const Timeout: Story = { args: { initialState: 'timeout' } };
export const Offline: Story = { args: { initialState: 'offline' } };
export const NetworkError: Story = { args: { initialState: 'network_error' } };
export const InvalidAddress: Story = { args: { initialState: 'invalid_address' } };
export const OutOfArea: Story = { args: { initialState: 'out_of_area' } };
export const Success: Story = { args: { initialState: 'success' } };
export const ReducedMotion: Story = { args: { initialState: 'locating' }, parameters: { reducedMotion: 'reduce' } };
export const LongAddress: Story = { args: { initialState: 'resolved', demoVariant: 'long_address' } };
export const Hotel: Story = { args: { initialState: 'resolved', demoVariant: 'hotel' } };
export const Condominium: Story = { args: { initialState: 'resolved', demoVariant: 'condominium' } };
export const English: Story = { args: { initialState: 'idle', locale: 'en' } };
export const Portuguese: Story = { args: { initialState: 'idle', locale: 'pt' } };
