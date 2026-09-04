'use client';

import React, { useId, useState } from 'react';
import { Icon } from '../icons/Icon';

export interface SearchFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onFilter?: () => void;
  loading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
}

export function SearchField({
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  onFilter,
  loading = false,
  disabled = false,
  ariaLabel = 'Busca productos, marcas o categorías',
  placeholder = 'Busca productos, marcas…',
}: SearchFieldProps) {
  const id = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;
  const blocked = disabled || loading;

  return (
    <form
      className="hly-search"
      role="search"
      aria-label="Buscar en el catálogo"
      aria-busy={loading || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (!blocked && onSubmit) onSubmit(currentValue);
      }}
    >
      <label className="hly-visually-hidden" htmlFor={id}>{ariaLabel}</label>
      <Icon name="search" size={22} />
      <input
        id={id}
        aria-label={ariaLabel}
        type="search"
        value={currentValue}
        placeholder={loading ? 'Cargando catálogo…' : placeholder}
        disabled={blocked}
        onChange={(event) => {
          if (value === undefined) setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
      />
      <button
        type="button"
        className="hly-search__filter"
        aria-label="Abrir filtros"
        disabled={blocked || !onFilter}
        onClick={onFilter}
      >
        <Icon name="filter" size={21} />
      </button>
    </form>
  );
}
