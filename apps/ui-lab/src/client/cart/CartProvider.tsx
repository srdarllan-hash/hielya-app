'use client';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Snackbar } from '../../../../../packages/ui/src/components/Snackbar';
import type { CartView, CartValidation } from '../../../../../packages/application/src/cart';
import type { LocationResult } from '@hielya/location';
import { useAuthSessionPort } from '../auth/AuthProvider';

const copy: Record<string, string> = {
  OUT_OF_STOCK: 'No hay suficiente stock disponible.', MINIMUM_NOT_REACHED: 'El pedido mínimo es de 25 € en productos.',
  OUTSIDE_AREA: 'Esta dirección está fuera del área actual de 4 km', STORE_CLOSED: 'Tienda cerrada · Volvemos a las 10:00',
  ALCOHOL_CUTOFF: 'Alcohol no disponible: la entrega debe finalizar antes de las 22:00',
  PUBLIC_SPACE_BLOCKED: 'Selecciona una dirección de entrega válida.', EMPTY_CART: 'Tu carrito está vacío. Añade productos para continuar.',
  STALE_REVISION: 'El carrito ha cambiado. Revisa los productos e inténtalo de nuevo.', UNAUTHORIZED: 'Inicia sesión para continuar.',
  SKU_LIMIT_EXCEEDED: 'Has alcanzado el límite de este producto.',
};
interface CartContextValue {
  cart: CartView | null; busy: boolean; error: string | null; location: LocationResult | null;
  loginDestination(): string; arrive(): void;
  navigate(path: string): void;
  selectLocation(value: LocationResult): void;
  refresh(): Promise<void>; add(productId: string): Promise<void>; edit(itemId: string, quantity: number): Promise<void>; proceed(): Promise<void>;
}
const Context = createContext<CartContextValue | null>(null);
export const useOptionalCart = () => useContext(Context);
export function useCart() { const value = useContext(Context); if (!value) throw new Error('Cart provider required'); return value; }
export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const sessions = useAuthSessionPort();
  const [cart, setCart] = useState<CartView | null>(null); const current = useRef<CartView | null>(null);
  const [busy, setBusy] = useState(false); const working = useRef(false);
  const [error, setError] = useState<string | null>(null); const [location, setLocation] = useState<LocationResult | null>(null);
  const addressId = useRef<string | null>(null); const loginFromCart = useRef(false);
  const creationKey = useRef<string | null>(null); const uncertain = useRef<{ signature: string; key: string } | null>(null);
  const publish = (value: CartView) => { current.current = value; setCart(value); };
  async function request<T>(path: string, method = 'GET', body?: unknown, key?: string): Promise<T> {
    const token = sessions.read()?.sessionToken;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api/v1/${path}`, { method, cache: 'no-store', signal: controller.signal,
        headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(key ? { 'idempotency-key': key } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json();
      if (!response.ok) { if (result.cart && Array.isArray(result.violations)) publish(result.cart); uncertain.current = null; if (response.status === 401) sessions.clear(); throw new Error(result.code ?? result.violations?.[0] ?? 'SERVICE_UNAVAILABLE'); }
      return result as T;
    } finally { clearTimeout(timeout); }
  }
  async function run(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true; setBusy(true); setError(null);
    try { await action(); }
    catch (e) { setError(copy[e instanceof Error ? e.message : ''] ?? 'No hemos podido confirmar el resultado. Comprueba tu conexión.'); }
    finally { working.current = false; setBusy(false); }
  }
  async function ensureCart() {
    if (current.current) return current.current;
    creationKey.current ??= crypto.randomUUID();
    const value = await request<CartView>('carts', 'POST', {}, creationKey.current); publish(value); return value;
  }
  async function refresh() { await run(async () => {
    if (!current.current) return;
    if (addressId.current && sessions.read()) {
      const result = await request<CartValidation>(`carts/${current.current.id}/validate`, 'POST', { addressId: addressId.current }); publish(result.cart);
    } else publish(await request<CartView>(`carts/${current.current.id}`));
  }); }
  async function mutation(productId: string | undefined, itemId: string | undefined, quantity: number) {
    await run(async () => {
      const value = await ensureCart();
      const signature = JSON.stringify({ productId, itemId, quantity });
      const retry = uncertain.current?.signature === signature ? uncertain.current : { signature, key: crypto.randomUUID() };
      uncertain.current = retry;
      const response = await request<CartView>(`carts/${value.id}/items${itemId ? `/${itemId}` : ''}`, itemId ? 'PATCH' : 'POST', { ...(itemId ? {} : { productId }), quantity, revision: value.revision }, retry.key);
      uncertain.current = null; publish(response);
    });
  }
  async function proceed() {
    if (!sessions.read()) { loginFromCart.current = true; router.push('/login'); return; }
    if (!location) { router.push('/cart/address'); return; }
    await run(async () => {
      let value = await ensureCart();
      value = await request<CartView>(`carts/${value.id}/claim`, 'POST', {}); publish(value);
      if (!addressId.current) {
        const a = location.address;
        const result = await request<{ id: string }>('addresses', 'POST', { formatted: a.formatted, latitude: a.coordinates.latitude, longitude: a.coordinates.longitude, kind: a.kind }, crypto.randomUUID());
        addressId.current = result.id;
      }
      const validation = await request<CartValidation>(`carts/${value.id}/validate`, 'POST', { addressId: addressId.current });
      publish(validation.cart);
      if (!validation.valid) { setError(validation.violations.map(v => copy[v] ?? 'No se puede continuar.').join(' ')); return; }
      const signature = JSON.stringify({ addressId: addressId.current, revision: validation.cart.revision });
      const retry = uncertain.current?.signature === signature ? uncertain.current : { signature, key: crypto.randomUUID() }; uncertain.current = retry;
      const result = await request<CartValidation>('checkout/reservations', 'POST', { cartId: value.id, addressId: addressId.current, revision: validation.cart.revision }, retry.key);
      uncertain.current = null; publish(result.cart);
      if (!result.valid) setError(result.violations.map(v => copy[v] ?? 'No se puede continuar.').join(' '));
    });
  }
  useEffect(() => sessions.subscribe(() => {
    if (sessions.read() && current.current) void run(async () => {
      publish(await request<CartView>(`carts/${current.current!.id}/claim`, 'POST', {}));
    });
  }));
  useEffect(() => {
    const listener = (event: Event) => { const detail = (event as CustomEvent<{ action: string; value?: string }>).detail;
      if (detail.action === 'open-cart') router.push('/cart');
      if ((detail.action === 'add-product' || detail.action === 'add-pack') && detail.value) void mutation(detail.value, undefined, 1);
    };
    window.addEventListener('hielya:ui-action', listener); return () => window.removeEventListener('hielya:ui-action', listener);
  });
  return <Context.Provider value={{ cart, busy, error, location, loginDestination: () => loginFromCart.current ? "/cart" : "/", arrive: () => { loginFromCart.current = false; }, navigate: path => router.push(path),
    selectLocation(value) { setLocation(value); addressId.current = null; }, refresh,
    add: id => mutation(id, undefined, 1), edit: (id, quantity) => mutation(undefined, id, quantity), proceed }}>{children}{error && pathname !== "/cart" && <Snackbar message={error} tone="warning" />}</Context.Provider>;
}
