import type { Meta, StoryObj } from '@storybook/react';
import { CartScreen } from './CartScreen';
import type { CartView } from '../../../../application/src/cart';
const now = '2030-01-01T12:00:00.000Z';
// Synthetic display fixtures, never production prices or customer data.
export const cartFixture: CartView = {
  id: '00000000-0000-4000-8000-000000000001', revision: 1, status: 'ACTIVE',
  items: [{ id: 'test-line', quantity: 1, unitPriceCents: 2500, lineTotalCents: 2500, product: { id: 'test-product', sku: 'TEST', name: 'Producto de prueba', categoryId: 'test', salePriceCents: 2500, currency: 'EUR', availability: 'AVAILABLE', isPack: false, iceIncluded: false, maxPerOrder: 10, containsAlcohol: false } }],
  productSubtotalCents: 2500, deliveryFeeCents: 440, totalCents: 2940, minimumReached: true, amountMissingForMinimumCents: 0,
  reservation: null, availability: { storeStatus: 'OPEN', demand: { level: 'NORMAL', estimate: null }, alcohol: { status: 'AVAILABLE', reason: 'ELIGIBLE', snapshot: null } }, serverNow: now, refreshAfterMs: 15000,
};
const meta = { title: 'Screens/Cart', component: CartScreen, args: { cart: cartFixture, onBack() {}, onEdit() {}, onContinue() {}, onRefresh() {} } } satisfies Meta<typeof CartScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Empty: Story = { args: { cart: null } };
export const Loading: Story = { args: { busy: true } };
export const BelowMinimum: Story = { args: { cart: { ...cartFixture, productSubtotalCents: 2000, totalCents: 2440, minimumReached: false, amountMissingForMinimumCents: 500 } } };
export const AddressPending: Story = { args: { cart: { ...cartFixture, deliveryFeeCents: null, totalCents: null } } };
export const NetworkError: Story = { args: { error: 'No hemos podido confirmar el resultado. Comprueba tu conexión.' } };
export const StockError: Story = { args: { error: 'No hay suficiente stock disponible.' } };
export const OutsideArea: Story = { args: { error: 'Esta dirección está fuera del área actual de 4 km' } };
export const Closed: Story = { args: { error: 'Tienda cerrada · Volvemos a las 10:00' } };
export const AlcoholUnavailable: Story = { args: { cart: { ...cartFixture, availability: { ...cartFixture.availability, alcohol: { status: 'UNAVAILABLE', reason: 'CUTOFF_REACHED', snapshot: null } } } } };
export const HighDemandAndAlcoholUnavailable: Story = { args: { cart: { ...cartFixture, availability: { ...cartFixture.availability, demand: { level: 'HIGH', estimate: null }, alcohol: { status: 'UNAVAILABLE', reason: 'CUTOFF_REACHED', snapshot: null } } } } };
export const Reserved: Story = { args: { remainingSeconds: 600, cart: { ...cartFixture, status: 'RESERVED', reservation: { id: 'test-reservation', status: 'ACTIVE', expiresAt: '2030-01-01T12:10:00.000Z' } } } };
export const Expired: Story = { args: { cart: { ...cartFixture, reservation: { id: 'test-reservation', status: 'EXPIRED', expiresAt: now } } } };
