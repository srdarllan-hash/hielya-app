'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { StatusBadge, type StatusTone } from './StatusBadge';

export interface ProductCardProps {
  name: string;
  size?: string | null;
  price: string;
  image?: string | null;
  productId?: string;
  unavailable?: boolean;
  lowStock?: boolean;
  statusLabel?: string;
  statusTone?: StatusTone;
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
  statusLabel,
  statusTone = 'neutral',
  disabled = false,
  loading = false,
  onAdd,
}: ProductCardProps) {
  const blocked = unavailable || disabled || loading || !onAdd;
  return (
    <article className={`hly-product-card${blocked ? ' is-disabled' : ''}`} aria-busy={loading || undefined}>
      <div className="hly-product-card__image">
        {image ? <img src={image} alt={[name, size].filter(Boolean).join(' ')} /> : <span aria-hidden="true">{name.slice(0, 1)}</span>}
      </div>
      <div className="hly-product-card__body">
        <h3>{name}</h3>
        {size ? <p>{size}</p> : null}
        {lowStock ? <StatusBadge tone="warning">Últimas unidades</StatusBadge> : null}
        {!lowStock && statusLabel ? <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge> : null}
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
