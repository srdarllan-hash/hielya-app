'use client';
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useOptionalCart } from '../cart/CartProvider';
import { useRouter } from 'next/navigation';
import { createAuthFlow } from '@hielya/application/client-auth';
import { PhoneLoginScreen, OtpVerificationScreen, type OtpPositions, type OtpVerificationScreenProps } from '@hielya/ui';
import { createOtpClient } from './otp-client';
import { useAuthSessionPort, useIsAuthenticated } from './AuthProvider';

const empty = (): OtpPositions => ['', '', '', '', '', ''];
const requestCopy = { phone: 'Introduce un número válido de 9 dígitos.', network: 'No hemos podido confirmar el resultado. Comprueba tu conexión.', service: 'El servicio no está disponible temporalmente.', cooldown: 'Este código no está disponible. Solicita otro cuando puedas.' };

function OtpEntry(props: Omit<OtpVerificationScreenProps, 'value' | 'onChange'>) {
  const [positions, setPositions] = useState<OtpPositions>(empty);
  return <OtpVerificationScreen {...props} value={positions} onChange={value => setPositions(value.positions)} />;
}

/** TEMPORARY PURCHASE INTEGRATION: /login is explicit; checkout will supply the real entry/continuation. */
export function AuthRuntime() {
  const router = useRouter();
  const cart = useOptionalCart();
  const [destination] = useState(() => cart?.loginDestination() ?? "/");
  const sessions = useAuthSessionPort();
  const authenticated = useIsAuthenticated();
  const machine = useMemo(() => createAuthFlow(createOtpClient(), sessions), [sessions]);
  const state = useSyncExternalStore(machine.subscribe, machine.getSnapshot, machine.getSnapshot);
  useEffect(() => {
    const timer = setInterval(machine.tick, 1000);
    return () => { clearInterval(timer); machine.cancel(); };
  }, [machine]);
  useEffect(() => {
    if (state.screen === 'success' || authenticated) { router.replace(destination); }
  }, [state.screen, authenticated, router, destination]);
  const error = state.requestError ? requestCopy[state.requestError] : undefined;
  if (state.screen === 'phone') return <PhoneLoginScreen value={state.nationalDigits} loading={state.requesting}
    error={state.requestError === 'phone' ? undefined : error} phoneError={state.requestError === 'phone' ? error : undefined} cooldownSeconds={state.resendSeconds} cooldownBlocked={state.resendBlocked}
    onChange={value => machine.setPhone(value.nationalDigits)} onSubmit={() => void machine.request()}
    onSkip={() => { machine.cancel(); router.replace(destination); }} />;
  return <OtpEntry key={state.challengeVersion}
    maskedPhone={state.maskedPhone} status={state.verification} requesting={state.requesting} requestError={error}
    expiresSeconds={state.expiresSeconds} resendSeconds={state.resendSeconds} resendBlocked={state.resendBlocked}
    onComplete={code => void machine.verify(code)} onRetry={code => void machine.retry(code)} onResend={() => void machine.request()}
    onChangeNumber={machine.changeNumber} />;
}
