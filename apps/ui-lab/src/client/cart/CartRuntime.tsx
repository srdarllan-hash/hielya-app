'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartScreen } from '../../../../../packages/ui/src/screens/cart/CartScreen';
import { useCart } from './CartProvider';
export function CartRuntime() {
  const state = useCart(); const router = useRouter(); const latest = useRef(state); useEffect(() => { latest.current = state; });
  useEffect(() => { latest.current.arrive(); }, []);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => void latest.current.refresh(), Math.max(250, state.cart?.refreshAfterMs ?? 15000));
    const refresh = () => { if (document.visibilityState === 'visible') void latest.current.refresh(); };
    window.addEventListener('online', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [state.cart]);
  useEffect(() => {
    const value = state.cart; const received = performance.now();
    const tick = () => { const seconds = value?.reservation?.status === 'ACTIVE' ? Math.max(0, Math.ceil((Date.parse(value.reservation.expiresAt) - Date.parse(value.serverNow) - (performance.now() - received)) / 1000)) : 0; setRemaining(seconds); };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [state.cart]);
  return <CartScreen cart={state.cart} busy={state.busy} error={state.error} remainingSeconds={remaining} address={state.location?.address.formatted}
    onBack={() => router.push('/')} onEdit={(id, quantity) => void state.edit(id, quantity)} onContinue={() => void state.proceed()} onRefresh={() => void state.refresh()} />;
}
