'use client';
import React from 'react';
import { AppShell } from '../../components/AppShell';
import { Button } from '../../components/Button';
import type { CartView } from '../../../../application/src/cart';
import styles from './cart.module.css';
const money = (cents: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export interface CartScreenProps {
  cart: CartView | null; busy?: boolean; error?: string | null; remainingSeconds?: number;
  address?: string; onBack(): void; onEdit(id: string, quantity: number): void; onContinue(): void; onRefresh(): void;
}
export function CartScreen({ cart, busy = false, error, remainingSeconds = 0, address, onBack, onEdit, onContinue, onRefresh }: CartScreenProps) {
  const active = cart?.reservation?.status === 'ACTIVE'; const expired = cart?.reservation?.status === 'EXPIRED';
  return <AppShell screenState="cart"><main className={styles.screen} lang="es">
    <header className={styles.header}><Button variant="ghost" onClick={onBack}>Volver</Button><h1>Mi carrito</h1></header>
    {error && <div role="alert" className={styles.notice}><p>{error}</p><Button variant="secondary" onClick={onRefresh} disabled={busy}>Reintentar</Button></div>}
    {cart?.availability.demand.level === 'HIGH' && <p className={styles.notice}>Alta demanda</p>}
    {cart?.availability.alcohol.status === 'UNAVAILABLE' && <p className={styles.notice}>Alcohol no disponible: la entrega debe finalizar antes de las 22:00</p>}
    {!cart?.items.length ? <p>Tu carrito está vacío. Añade productos para continuar.</p> : <>
      <ul className={styles.items}>{cart.items.map(item => <li key={item.id} className={styles.item}>
        <h2>{item.product.name}</h2><p>{money(item.lineTotalCents)}</p>
        <div className={styles.quantity} role="group" aria-label={`Cantidad de ${item.product.name}`}>
          <Button variant="secondary" aria-label={`Reducir ${item.product.name}`} disabled={busy || item.quantity === 1} onClick={() => onEdit(item.id, item.quantity - 1)}>−</Button>
          <span aria-label="Cantidad">{item.quantity}</span>
          <Button variant="secondary" aria-label={`Añadir ${item.product.name}`} disabled={busy || (item.product.containsAlcohol && cart.availability.alcohol.status !== 'AVAILABLE')} onClick={() => onEdit(item.id, item.quantity + 1)}>+</Button>
          <Button variant="ghost" disabled={busy} onClick={() => onEdit(item.id, 0)} aria-label={`Eliminar ${item.product.name}`}>Eliminar</Button>
        </div>
      </li>)}</ul>
      {address && <p>{address}</p>}
      <dl className={styles.totals}><dt>Subtotal</dt><dd>{money(cart.productSubtotalCents)}</dd><dt>Entrega</dt><dd>{cart.deliveryFeeCents === null ? 'Pendiente de dirección' : money(cart.deliveryFeeCents)}</dd><dt>Total</dt><dd>{cart.totalCents === null ? 'Pendiente de dirección' : money(cart.totalCents)}</dd></dl>
      {!cart.minimumReached && <p className={styles.notice}>Faltan {money(cart.amountMissingForMinimumCents)} para alcanzar el pedido mínimo de 25 €. Agrega más productos para continuar.</p>}
      <div role="status">{active ? <><p>Productos reservados</p><p role="timer" aria-label="Tiempo restante de reserva">{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}</p></> : expired ? <p>Reserva caducada</p> : null}</div>
      {!active && <Button variant="primary" size="md" fullWidth loading={busy} onClick={onContinue}>{expired ? 'Reservar de nuevo' : 'Continuar'}</Button>}
    </>}
  </main></AppShell>;
}
