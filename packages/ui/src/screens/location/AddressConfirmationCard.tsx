import React from 'react';
import type { LocationResult } from '@hielya/location';
import { Icon } from '../../icons/Icon';

export interface AddressConfirmationCardProps {
  location: LocationResult;
  kindLabel: string;
}

export function AddressConfirmationCard({ location, kindLabel }: AddressConfirmationCardProps) {
  const { address, serviceArea } = location;
  return (
    <section className="hly-location-address" aria-label="Dirección seleccionada">
      <span className="hly-location-address__icon" aria-hidden="true"><Icon name="location" size={24} /></span>
      <div>
        <span className="hly-location-address__kind">{kindLabel}</span>
        <h2>{address.formatted}</h2>
        <p>{[address.unit, address.meetingPoint].filter(Boolean).join(' · ') || address.locality}</p>
        {serviceArea?.serviceable ? (
          <dl>
            <div><dt>Distancia</dt><dd>{serviceArea.distanceMeters === null ? 'Pendiente' : `${(serviceArea.distanceMeters / 1000).toFixed(1)} km`}</dd></div>
            <div><dt>Entrega</dt><dd>{serviceArea.estimatedMinutes ? `${serviceArea.estimatedMinutes} min` : 'Pendiente'}</dd></div>
            <div><dt>Tarifa</dt><dd>{serviceArea.deliveryFeeCents === null ? 'Pendiente' : `€${(serviceArea.deliveryFeeCents / 100).toFixed(2)}`}</dd></div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}
