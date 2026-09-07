import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PhoneLoginScreen } from './PhoneLoginScreen';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import type { OtpPositions, OtpStatus } from '../../components/OtpInput';

// No args/actions instrumentation: these are local synthetic state fixtures, never a credential channel.
const meta = { title: 'Screens/Authentication', parameters: { layout: 'fullscreen', actions: { disable: true }, controls: { disable: true } } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function Phone({ initial = '', loading = false, error, cooldown = 0 }: { initial?: string; loading?: boolean; error?: string; cooldown?: number }) {
  const [value, setValue] = useState(initial);
  return <PhoneLoginScreen value={value} loading={loading} error={error} cooldownSeconds={cooldown} cooldownBlocked={cooldown > 0} onChange={v => setValue(v.nationalDigits)} onSubmit={() => undefined} onSkip={() => undefined} />;
}
function Otp({ status = 'idle', initial = ['', '', '', '', '', ''], cooldown = 30, expiry = 240, requestError, requesting = false }: { status?: OtpStatus; initial?: OtpPositions; cooldown?: number; expiry?: number; requestError?: string; requesting?: boolean }) {
  const [value, setValue] = useState<OtpPositions>(initial);
  const [state, setState] = useState(status);
  return <OtpVerificationScreen maskedPhone="+34 ******678" value={value} status={state} requesting={requesting} requestError={requestError} expiresSeconds={expiry} resendSeconds={cooldown} resendBlocked={cooldown > 0} onChange={v => setValue(v.positions)} onComplete={() => setState('loading')} onRetry={() => setState('loading')} onResend={() => undefined} onChangeNumber={() => undefined} />;
}
const filled: OtpPositions = ['1','2','3','4','5','6'];
export const PhoneEmpty: Story = { render: () => <Phone /> };
export const PhoneTyping: Story = { render: () => <Phone initial="612" /> };
export const PhoneValid: Story = { render: () => <Phone initial="612345678" /> };
export const PhoneLoading: Story = { render: () => <Phone initial="612345678" loading /> };
export const PhoneNetworkError: Story = { render: () => <Phone initial="612345678" error="No hemos podido confirmar el resultado. Comprueba tu conexión." /> };
export const PhoneServiceError: Story = { render: () => <Phone error="El servicio no está disponible temporalmente." /> };
export const PhoneCooldown: Story = { render: () => <Phone initial="612345678" cooldown={30} /> };
export const OtpEmpty: Story = { render: () => <Otp /> };
export const OtpPartial: Story = { render: () => <Otp initial={['1','2','','','','']} /> };
export const OtpComplete: Story = { render: () => <Otp initial={filled} /> };
export const OtpVerifying: Story = { render: () => <Otp status="loading" initial={filled} /> };
export const OtpInvalid: Story = { render: () => <Otp status="invalid" /> };
export const OtpExpired: Story = { render: () => <Otp status="expired" expiry={0} cooldown={0} /> };
export const OtpLocked: Story = { render: () => <Otp status="locked" /> };
export const OtpNetworkError: Story = { render: () => <Otp status="network-error" initial={filled} /> };
export const OtpUnavailable: Story = { render: () => <Otp status="unavailable" initial={filled} /> };
export const OtpServiceError: Story = { render: () => <Otp status="service-unavailable" initial={filled} /> };
export const OtpResendAvailable: Story = { render: () => <Otp cooldown={0} /> };
export const OtpResending: Story = { render: () => <Otp requesting /> };
export const OtpResendError: Story = { render: () => <Otp cooldown={0} requestError="El servicio no está disponible temporalmente." /> };
export const OtpSuccess: Story = { render: () => <Otp status="success" /> };

export const OtpDisabled: Story = { render: () => <Otp status="cooldown" /> };
export const OtpCooldown: Story = { render: () => <Otp cooldown={60} /> };
export const PhoneInvalid: Story = { render: () => <PhoneLoginScreen value="612" phoneError="Introduce un número válido de 9 dígitos." onChange={() => undefined} onSubmit={() => undefined} onSkip={() => undefined} /> };
