import React from 'react';
import { Icon } from '../icons/Icon';
export function DeliveryQuoteCard({ blocked=false, eta='30–45 min' }: { blocked?: boolean; eta?: string }) {
  return <section className="hly-delivery-card" aria-label="Resumen de entrega">
    <button className="hly-delivery-card__address" type="button" aria-label="Cambiar dirección de entrega">
      <Icon name="location"/><span><strong>Paseo Marítimo Rey de España, 65</strong><small>29640 Fuengirola, Málaga</small></span><Icon name="chevron-right" size={20}/>
    </button>
    <div className="hly-delivery-card__facts">
      <div><Icon name="clock"/><span><small>Entrega estimada</small><strong>{blocked ? 'No disponible' : eta}</strong></span></div>
      <div><Icon name="scooter"/><span><small>Área de entrega</small><strong>Hasta 4 km</strong></span></div>
      <div><Icon name="bag"/><span><small>Pedido mínimo</small><strong>€25</strong></span></div>
    </div>
  </section>;
}
