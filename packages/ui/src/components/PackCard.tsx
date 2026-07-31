'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

export interface PackCardProps {
  name: string;
  description: string[];
  price: string;
  discount: string;
  image: string;
  packId?: string;
  disabled?: boolean;
  loading?: boolean;
  onAdd?: (packId: string) => void;
}

export function PackCard({
  name,
  description,
  price,
  discount,
  image,
  packId = name,
  disabled = false,
  loading = false,
  onAdd,
}: PackCardProps) {
  const blocked = disabled || loading || !onAdd;
  return (
    <article className={`hly-pack-card${blocked ? ' is-disabled' : ''}`} aria-busy={loading || undefined}>
      <img src={image} alt="" />
      <div className="hly-pack-card__copy">
        <h3>{name}</h3>
        {description.map((line) => <p key={line}>• {line}</p>)}
        <div><strong>{price}</strong><span>{discount}</span></div>
      </div>
      <button
        type="button"
        aria-label={blocked ? `${name} no disponible` : `Añadir ${name} al carrito`}
        disabled={blocked}
        onClick={() => onAdd?.(packId)}
      >
        <Icon name={blocked ? 'close' : 'plus'} size={20} />
      </button>
    </article>
  );
}
