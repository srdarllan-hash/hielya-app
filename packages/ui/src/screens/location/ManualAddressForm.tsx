'use client';

import React, { useId, useState } from 'react';
import type { AddressSuggestion } from '@hielya/location';
import { Button } from '../../components/Button';
import { AddressSuggestionList } from './AddressSuggestionList';

export interface ManualAddressFormProps {
  query: string;
  suggestions: AddressSuggestion[];
  loading?: boolean;
  disabled?: boolean;
  label: string;
  placeholder: string;
  searchLabel: string;
  suggestionLabel: string;
  useCurrentLocationLabel: string;
  errorMessage?: string;
  onQueryChange(query: string): void;
  onSearch(): void;
  onSelect(suggestion: AddressSuggestion): void;
  onUseCurrentLocation(): void;
}

export function ManualAddressForm({
  query,
  suggestions,
  loading = false,
  disabled = false,
  label,
  placeholder,
  searchLabel,
  suggestionLabel,
  useCurrentLocationLabel,
  errorMessage,
  onQueryChange,
  onSearch,
  onSelect,
  onUseCurrentLocation,
}: ManualAddressFormProps) {
  const inputId = useId();
  const listId = useId();
  const errorId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeSuggestion = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
  const blocked = loading || disabled;
  return (
    <form
      className="hly-location-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (activeSuggestion) onSelect(activeSuggestion); else onSearch();
      }}
    >
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        value={query}
        placeholder={placeholder}
        disabled={blocked}
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeSuggestion ? `${listId}-${activeSuggestion.id}` : undefined}
        aria-invalid={Boolean(errorMessage) || undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        onChange={(event) => {
          setActiveIndex(-1);
          onQueryChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (!suggestions.length) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === 'Escape') {
            setActiveIndex(-1);
          }
        }}
      />
      {errorMessage ? <p id={errorId} className="hly-location-form__error">{errorMessage}</p> : null}
      <AddressSuggestionList
        id={listId}
        label={suggestionLabel}
        suggestions={suggestions}
        activeIndex={activeIndex}
        onSelect={onSelect}
      />
      <div className="hly-location-form__actions">
        <Button type="submit" fullWidth loading={loading} disabled={disabled || query.trim().length < 3} leadingIcon="search">
          {searchLabel}
        </Button>
        <Button variant="secondary" fullWidth disabled={blocked} leadingIcon="location" onClick={onUseCurrentLocation}>
          {useCurrentLocationLabel}
        </Button>
      </div>
    </form>
  );
}
