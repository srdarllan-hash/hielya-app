'use client';
import React from 'react';
import { AppShell } from '../../components/AppShell';
import { BrandLockup } from '../../components/BrandLockup';
import { Button } from '../../components/Button';
import { PhoneInput, type PhoneValue } from '../../components/PhoneInput';
import styles from './auth.module.css';

export interface PhoneLoginScreenProps {
  value: string;
  loading?: boolean;
  error?: string;
  phoneError?: string;
  cooldownSeconds?: number;
  cooldownBlocked?: boolean;
  onChange: (value: PhoneValue) => void;
  onSubmit: () => void;
  onSkip: () => void;
}
export function PhoneLoginScreen({ value, loading = false, error, phoneError, cooldownSeconds = 0, cooldownBlocked = false, onChange, onSubmit, onSkip }: PhoneLoginScreenProps) {
  return <AppShell screenState="auth-phone"><main className={styles.screen} data-screen-id="C-003" lang="es">
    <header className={styles.header}><BrandLockup align="center" /></header>
    <section className={styles.intro} aria-labelledby="phone-title">
      <h1 id="phone-title">Entra con tu móvil</h1>
      <p>Te enviaremos un código para confirmar tu número.</p>
    </section>
    <form className={styles.form} onSubmit={event => { event.preventDefault(); if (!loading && !cooldownBlocked) onSubmit(); }}>
      <PhoneInput label="Número de teléfono" value={value} onChange={onChange} required error={phoneError} errorSource="submit" autoFocus={false} loading={loading} />
      {error && <p className={styles.error} role="alert">{error}</p>}
      {cooldownSeconds > 0 && <p className={styles.timer}>Podrás solicitar otro código en {cooldownSeconds} s.</p>}
      <Button type="submit" size="lg" fullWidth loading={loading} disabled={value.length !== 9 || cooldownBlocked}>Continuar</Button>
    </form>
    <div className={styles.alternative}><span>o</span><button className={styles.link} type="button" onClick={onSkip}>Ahora no</button></div>
  </main></AppShell>;
}
