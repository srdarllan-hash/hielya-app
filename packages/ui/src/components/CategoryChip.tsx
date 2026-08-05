'use client';

import React from 'react';

export interface CategoryChipProps {
  label: string;
  image?: string | null;
  value?: string;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  onSelect?: (value: string) => void;
}

export function CategoryChip({
  label,
  image,
  value = label,
  active = false,
  disabled = false,
  loading = false,
  ariaLabel,
  onSelect,
}: CategoryChipProps) {
  const blocked = disabled || loading || !onSelect;
  return (
    <button
      type="button"
      className={`hly-category-chip${active ? ' is-active' : ''}`}
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      aria-busy={loading || undefined}
      disabled={blocked}
      onClick={() => onSelect?.(value)}
    >
      <span className="hly-category-chip__visual">
        {image ? <img src={image} alt="" /> : <span aria-hidden="true">{label.slice(0, 1)}</span>}
      </span>
      <span>{label}</span>
    </button>
  );
}
