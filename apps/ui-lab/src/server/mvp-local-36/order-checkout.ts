import { OrderFoundationError, type CheckoutContext } from '../../../../../packages/application/src/orders';
import type { CartView } from '../../../../../packages/application/src/cart';
import type { AuthoritativeCheckoutSource } from '../../../../../packages/persistence/src/order-foundation';

/** Request-local result of CartService.validate; load performs no asynchronous work. */
export class MaterializedCheckoutSource implements AuthoritativeCheckoutSource {
  private readonly context: CheckoutContext;
  constructor(cart: CartView, customerId: string, addressId: string) {
    if (cart.reservation?.status !== 'ACTIVE' || Date.parse(cart.reservation.expiresAt) <= Date.parse(cart.serverNow)) {
      throw new OrderFoundationError('RESERVATION_UNAVAILABLE');
    }
    this.context = { customerId, addressId, cartId: cart.id, cartRevision: cart.revision,
      reservationId: cart.reservation.id, acceptedSnapshot: null,
      items: cart.items.map(item => ({ productSku: item.product.sku, quantity: item.quantity,
        unitPriceCents: item.unitPriceCents, containsAlcohol: item.product.containsAlcohol })) };
  }
  load(): CheckoutContext { return structuredClone(this.context); }
}
