'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { StatusBadge } from './StatusBadge';

export interface ProductCardProps {
  name: string;
  size: string;
  price: string;
  image: string;
  productId?: string;
  unavailable?: boolean;
  lowStock?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onAdd?: (productId: string) => void;
}

export function ProductCard({
  name,
  size,
  price,
  image,
  productId = name,
  unavailable = false,
  lowStock = false,
  disabled = false,
  loading = false,
  onAdd,
}: ProductCardProps) {
  const blocked = unavailable || disabled || loading || !onAdd;
  return (
    <article className={`hly-product-card${blocked ? ' is-disabled' : ''}`} aria-busy={loading || undefined}>
      <div className="hly-product-card__image"><img src={image} alt={`${name} ${size}`} /></div>
      <div className="hly-product-card__body">
        <h3>{name}</h3>
        <p>{size}</p>
        {lowStock ? <StatusBadge tone="warning">Últimas unidades</StatusBadge> : null}
        <div className="hly-product-card__footer">
          <strong>{price}</strong>
          <button
            type="button"
            aria-label={blocked ? `${name} no disponible` : `Añadir ${name} al carrito`}
            disabled={blocked}
            onClick={() => onAdd?.(productId)}
          >
            <Icon name={blocked ? 'close' : 'plus'} size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
