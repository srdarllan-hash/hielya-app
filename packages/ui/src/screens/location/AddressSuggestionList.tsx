'use client';

import React from 'react';
import type { AddressSuggestion } from '@hielya/location';

export interface AddressSuggestionListProps {
  id: string;
  label: string;
  suggestions: AddressSuggestion[];
  activeIndex: number;
  onSelect(suggestion: AddressSuggestion): void;
}

export function AddressSuggestionList({ id, label, suggestions, activeIndex, onSelect }: AddressSuggestionListProps) {
  if (!suggestions.length) return null;
  return (
    <ul id={id} className="hly-location-suggestions" role="listbox" aria-label={label}>
      {suggestions.map((suggestion, index) => (
        <li
          id={`${id}-${suggestion.id}`}
          key={suggestion.id}
          role="option"
          aria-selected={index === activeIndex}
          className={index === activeIndex ? 'is-active' : undefined}
        >
          <button type="button" tabIndex={-1} onClick={() => onSelect(suggestion)}>
            <strong>{suggestion.label}</strong>
            {suggestion.secondaryLabel ? <small>{suggestion.secondaryLabel}</small> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
