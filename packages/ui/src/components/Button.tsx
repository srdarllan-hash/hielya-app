'use client';

import React from 'react';
import { Icon, type IconName } from '../icons/Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: IconName;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'hly-button',
    `hly-button--${variant}`,
    `hly-button--${size}`,
    fullWidth ? 'hly-button--full' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
    >
      {loading ? <span className="hly-button__spinner" aria-hidden="true" /> : leadingIcon ? <Icon name={leadingIcon} size={20} /> : null}
      <span>{children}</span>
    </button>
  );
}
