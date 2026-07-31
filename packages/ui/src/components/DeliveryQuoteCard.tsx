'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

export interface DeliveryQuoteCardProps {
  blocked?: boolean;
  eta?: string;
  addressLine?: string;
  localityLine?: string;
  deliveryRadiusLabel?: string;
  minimumOrderLabel?: string;
  onChangeAddress?: () => void;
  loading?: boolean;
}

export function DeliveryQuoteCard({
  blocked = false,
  eta = '30–45 min',
  addressLine = 'Paseo Marítimo Rey de España, 65',
  localityLine = '29640 Fuengirola, Málaga',
  deliveryRadiusLabel = 'Hasta 4 km',
  minimumOrderLabel = '€25',
  onChangeAddress,
  loading = false,
}: DeliveryQuoteCardProps) {
  const addressBlocked = loading || !onChangeAddress;
  return (
    <section className="hly-delivery-card" aria-label="Resumen de entrega" aria-busy={loading || undefined}>
      <button
        className="hly-delivery-card__address"
        type="button"
        aria-label="Cambiar dirección de entrega"
        onClick={onChangeAddress}
        disabled={addressBlocked}
      >
        <Icon name="location" />
        <span><strong>{addressLine}</strong><small>{localityLine}</small></span>
        <Icon name="chevron-right" size={20} />
      </button>
      <div className="hly-delivery-card__facts">
        <div><Icon name="clock" /><span><small>Entrega estimada</small><strong>{blocked ? 'No disponible' : eta}</strong></span></div>
        <div><Icon name="scooter" /><span><small>Área de entrega</small><strong>{deliveryRadiusLabel}</strong></span></div>
        <div><Icon name="bag" /><span><small>Pedido mínimo</small><strong>{minimumOrderLabel}</strong></span></div>
      </div>
    </section>
  );
}
