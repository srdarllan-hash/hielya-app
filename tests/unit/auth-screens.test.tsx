import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhoneLoginScreen } from '../../packages/ui/src/screens/auth/PhoneLoginScreen';
import { OtpVerificationScreen, formatAuthCountdown } from '../../packages/ui/src/screens/auth/OtpVerificationScreen';
import type { OtpPositions, OtpStatus } from '../../packages/ui/src/components/OtpInput';
import { AuthProvider, useAuthSessionPort, useIsAuthenticated } from '../../apps/ui-lab/src/client/auth/AuthProvider';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const none = () => undefined;
const empty: OtpPositions = ['','','','','',''];
function Otp({ status = 'idle', onComplete = none, onRetry = none }: { status?: OtpStatus; onComplete?: (code: string) => void; onRetry?: () => void }) {
 const [value,setValue] = useState<OtpPositions>(empty);
 return <OtpVerificationScreen maskedPhone="+34 ******678" value={value} onChange={v => setValue(v.positions)} status={status} expiresSeconds={300} resendSeconds={60} resendBlocked onComplete={onComplete} onRetry={onRetry} onResend={none} onChangeNumber={none} />;
}
describe('authentication screen compositions', () => {
 it('does not focus phone on entry, preserves Ahora no and disables incomplete submit', () => {
  const skip = vi.fn(); render(<PhoneLoginScreen value="" onChange={none} onSubmit={none} onSkip={skip} />);
  expect(screen.getByRole('textbox')).not.toHaveFocus(); expect(screen.getByRole('button',{name:'Continuar'})).toBeDisabled(); fireEvent.click(screen.getByRole('button',{name:'Ahora no'})); expect(skip).toHaveBeenCalledOnce();
 });
 it('associates server phone error and announces submit failure once', () => {
  render(<PhoneLoginScreen value="612345678" phoneError="Introduce un número válido de 9 dígitos." onChange={none} onSubmit={none} onSkip={none} />);
  expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid','true'); expect(screen.getAllByRole('alert')).toHaveLength(1);
 });
 it('focuses first OTP cell, completes automatically and supplies no Verificar fallback', () => {
  const completed = vi.fn(); render(<Otp onComplete={completed} />);
  const cells=screen.getAllByRole('textbox'); expect(cells).toHaveLength(6); expect(cells[0]).toHaveFocus();
  fireEvent.paste(cells[0],{clipboardData:{getData:()=> '１２３４５６'}}); expect(completed).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button',{name:'Verificar'})).not.toBeInTheDocument(); expect(screen.getByText('Nunca compartas este código')).toBeVisible();
 });
 it('renders masked header and silent countdowns', () => {
  render(<Otp />); expect(screen.getByText('+34 ******678')).toBeVisible(); expect(screen.getByText('05:00')).toBeVisible();
  const cooldown=screen.getByText('Podrás solicitar otro código en 60 s.'); expect(cooldown.closest('[aria-live],[role="alert"],[role="status"]')).toBeNull(); expect(screen.getByRole('button',{name:'Reenviar código'})).toBeDisabled();
 });
 it('preserves entered digits on network failure and focuses canonical retry', () => {
  const completed=vi.fn(), retry=vi.fn(); const {rerender}=render(<Otp onComplete={completed} />);
  fireEvent.paste(screen.getAllByRole('textbox')[0],{clipboardData:{getData:()=> '123456'}});
  rerender(<Otp status="network-error" onRetry={retry} />);
  expect(screen.getAllByRole('textbox').every(el => (el as HTMLInputElement).value.length === 1)).toBe(true);
  const button=screen.getByRole('button',{name:'Reintentar'}); expect(button).toHaveFocus(); expect(button).toHaveClass('hly-button--secondary','hly-button--md'); expect(button).not.toHaveClass('hly-button--full');
  fireEvent.click(button); expect(retry).toHaveBeenCalledOnce();
 });
 it('shows unavailable microcopy without false success', () => {
  render(<Otp status="unavailable" />); expect(screen.getByRole('alert')).toHaveTextContent('Este código no está disponible. Solicita otro cuando puedas.'); expect(screen.getAllByRole('textbox').every(el => (el as HTMLInputElement).disabled)).toBe(true);
 });
 it('formats expiration without negative time', () => { expect(formatAuthCountdown(0)).toBe('00:00'); expect(formatAuthCountdown(61)).toBe('01:01'); expect(formatAuthCountdown(-3)).toBe('00:00'); });
});

const restoredState = { expiresInSeconds: 3600, customer: { id: '22222222-2222-4222-8222-222222222222', phoneE164: '+34612345678', phoneVerifiedAt: '2026-09-07T00:00:00Z', status: 'ACTIVE' as const } };
function AuthenticationProbe() {
 const authenticated = useIsAuthenticated();
 const store = useAuthSessionPort();
 return <><output data-testid="authentication">{String(authenticated)}</output><button onClick={() => store.write({ customer: restoredState.customer, expiresAt: Date.now() + 3600000 })}>Authenticate</button></>;
}
describe('server session hydration', () => {
 it('restores only authentication state on each mount using same-origin credentials', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(restoredState)); vi.stubGlobal('fetch', fetcher);
  const first = render(<AuthProvider><AuthenticationProbe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId('authentication')).toHaveTextContent('true'));
  expect(fetcher).toHaveBeenCalledWith('/api/v1/auth/session', expect.objectContaining({ credentials: 'same-origin', cache: 'no-store', signal: expect.any(AbortSignal) }));
  expect(screen.queryByText(restoredState.customer.phoneE164)).toBeNull();
  first.unmount(); render(<AuthProvider><AuthenticationProbe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId('authentication')).toHaveTextContent('true'));
  expect(fetcher).toHaveBeenCalledTimes(2);
 });
 it.each([401, 503])('leaves authentication empty for HTTP %s', async status => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 'SESSION_INVALID' }, { status })); vi.stubGlobal('fetch', fetcher);
  await act(async () => { render(<AuthProvider><AuthenticationProbe /></AuthProvider>); });
  expect(screen.getByTestId('authentication')).toHaveTextContent('false');
 });
 it('does not overwrite a newer login with a late hydration result', async () => {
  let resolve!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(() => new Promise(r => { resolve = r; })));
  render(<AuthProvider><AuthenticationProbe /></AuthProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));
  await act(async () => resolve(Response.json({ code: 'SESSION_INVALID' }, { status: 401 })));
  expect(screen.getByTestId('authentication')).toHaveTextContent('true');
 });
 it('aborts hydration on unmount', () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => undefined)); vi.stubGlobal('fetch', fetcher);
  const view = render(<AuthProvider><AuthenticationProbe /></AuthProvider>); view.unmount();
  expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
 });
});
