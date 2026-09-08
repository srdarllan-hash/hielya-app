import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OtpInput, type OtpPositions, type OtpStatus } from './OtpInput';
import { Button } from './Button';

// Render-only stories: no OTP in Storybook args, controls, actions, spies or telemetry.
// All initial values below are synthetic fixtures. Never use real authentication codes here.
const meta = { title: 'Foundation/OtpInput', parameters: { actions: { disable: true }, controls: { disable: true } }, decorators: [(Story) => <div className="hly-story-frame"><Story /></div>] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const blank: OtpPositions = ['', '', '', '', '', ''];
const sample: OtpPositions = ['0', '1', '2', '3', '4', '5'];
function Demo({ initialStatus = 'idle', initialValue = blank, disabled = false, readOnly = false, autoFocus = false }: { initialStatus?: OtpStatus; initialValue?: OtpPositions; disabled?: boolean; readOnly?: boolean; autoFocus?: boolean }) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState(initialStatus);
  return <OtpInput value={value} onChange={(next) => setValue(next.positions)} status={status} disabled={disabled} readOnly={readOnly} autoFocus={autoFocus}
    cooldownSeconds={30} onComplete={() => setStatus('loading')} onRetry={() => setStatus('unavailable')} />;
}
export const Empty: Story = { render: () => <Demo /> };
export const Partial: Story = { render: () => <Demo initialValue={['0', '1', '', '', '', '']} /> };
export const Complete: Story = { render: () => <Demo initialValue={sample} /> };
export const Loading: Story = { render: () => <Demo initialStatus="loading" initialValue={sample} /> };
export const Invalid: Story = { render: () => <Demo initialStatus="invalid" /> };
export const Expired: Story = { render: () => <Demo initialStatus="expired" /> };
export const Locked: Story = { render: () => <Demo initialStatus="locked" /> };
export const Cooldown: Story = { render: () => <Demo initialStatus="cooldown" /> };
export const NetworkError: Story = { render: () => <Demo initialStatus="network-error" initialValue={sample} /> };
export const Unavailable: Story = { render: () => <Demo initialStatus="unavailable" initialValue={sample} /> };
export const ServiceUnavailable: Story = { render: () => <Demo initialStatus="service-unavailable" initialValue={sample} /> };
export const Success: Story = { render: () => <Demo initialStatus="success" initialValue={sample} /> };
export const Disabled: Story = { render: () => <Demo disabled /> };
export const ReadOnly: Story = { render: () => <Demo readOnly initialValue={sample} /> };
export const Focus: Story = { render: () => <Demo autoFocus /> };
export const Keyboard: Story = { render: () => <><Button>Antes</Button><Demo /><Button>Después</Button></> };
