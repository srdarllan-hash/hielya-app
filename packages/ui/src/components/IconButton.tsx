'use client';

import React from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface IconButtonProps {
  icon: IconName;
  label: string;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function IconButton({ icon, label, badge, onClick, disabled = false, loading = false }: IconButtonProps) {
  const blocked = disabled || loading || !onClick;
  return (
    <button
      className="hly-icon-button"
      type="button"
      aria-label={label}
      aria-busy={loading || undefined}
      onClick={onClick}
      disabled={blocked}
    >
      <Icon name={icon} />
      {badge && badge > 0 ? <span className="hly-icon-button__badge" aria-label={`${badge} artículos`}>{badge}</span> : null}
    </button>
  );
}
