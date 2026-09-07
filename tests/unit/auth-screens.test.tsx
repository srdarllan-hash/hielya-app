import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PhoneLoginScreen } from '../../packages/ui/src/screens/auth/PhoneLoginScreen';
import { OtpVerificationScreen, formatAuthCountdown } from '../../packages/ui/src/screens/auth/OtpVerificationScreen';
import type { OtpPositions, OtpStatus } from '../../packages/ui/src/components/OtpInput';
afterEach(cleanup);
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
