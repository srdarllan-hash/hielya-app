'use client';
import React from 'react';
import { AppShell } from '../../components/AppShell';
import { BrandLockup } from '../../components/BrandLockup';
import { Button } from '../../components/Button';
import { OtpInput, type OtpPositions, type OtpStatus, type OtpValue } from '../../components/OtpInput';
import styles from './auth.module.css';

export interface OtpVerificationScreenProps {
  maskedPhone: string;
  value: OtpPositions;
  status: OtpStatus;
  requesting?: boolean;
  requestError?: string;
  expiresSeconds: number;
  resendSeconds: number;
  resendBlocked: boolean;
  onChange: (value: OtpValue) => void;
  onComplete: (code: string) => void;
  onRetry: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}
export const formatAuthCountdown = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0')}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0')}`;
/** Presentation only: all timers, phone masking and transport decisions are application-owned. */
export function OtpVerificationScreen({ maskedPhone, value, status, requesting = false, requestError, expiresSeconds, resendSeconds, resendBlocked, onChange, onComplete, onRetry, onResend, onChangeNumber }: OtpVerificationScreenProps) {
  const busy = requesting || status === 'loading' || status === 'success';
  return <AppShell screenState="auth-otp"><main className={styles.screen} data-screen-id="C-004" lang="es">
    <header className={styles.header}><BrandLockup align="center" /></header>
    <section className={styles.intro} aria-labelledby="otp-title">
      <h1 id="otp-title">Introduce el código</h1>
      <p>Enviamos un código de 6 dígitos al <strong className={styles.phone}>{maskedPhone}</strong></p>
    </section>
    <OtpInput value={value} onChange={onChange} status={requesting ? 'loading' : status} autoFocus onComplete={onComplete} onRetry={onRetry} />
    {status === 'service-unavailable' && <div><Button variant="secondary" size="md" disabled={busy || !value.every(digit => /^[0-9]$/.test(digit))} onClick={() => onRetry(value.join(''))}>Reintentar</Button></div>}
    {status === 'success' && <p role="status">Código verificado.</p>}
    <p className={styles.timer}>El código expira en <strong>{formatAuthCountdown(expiresSeconds)}</strong></p>
    <section className={styles.resend} aria-label="Reenvío del código">
      <p>¿No lo recibiste?</p>
      <button type="button" className={styles.link} disabled={busy || resendBlocked} onClick={onResend}>Reenviar código</button>
      {resendSeconds > 0 && <p className={styles.timer}>Podrás solicitar otro código en {resendSeconds} s.</p>}
      {requestError && <p className={styles.error} role="alert">{requestError}</p>}
    </section>
    <aside className={styles.security}><p>Nunca compartas este código</p><p>HIELYA nunca te lo pedirá por teléfono.</p></aside>
    <p className={styles.alternative}>¿Número incorrecto? <button type="button" className={styles.link} onClick={onChangeNumber}>Cambiar número</button></p>
  </main></AppShell>;
}
