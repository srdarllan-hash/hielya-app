'use client';

import React from 'react';

export interface SectionHeaderProps {
  id?: string;
  title: string;
  action?: string;
  onAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
}

export function SectionHeader({ id, title, action, onAction, disabled = false, loading = false, ariaLabel }: SectionHeaderProps) {
  return (
    <div className="hly-section-header">
      <h2 id={id}>{title}</h2>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled || loading}
          aria-label={ariaLabel ?? action}
          aria-busy={loading || undefined}
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
