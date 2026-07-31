import React from 'react';
import { Icon, type IconName } from '../icons/Icon';

export type FeedbackVariant = 'error' | 'empty' | 'offline' | 'timeout' | 'maintenance' | 'success';
export type FeedbackAriaLive = 'off' | 'polite' | 'assertive';

export interface FeedbackAction {
  label: string;
  onAction: () => void;
  icon?: IconName;
  ariaLabel?: string;
}

export interface FeedbackStateProps {
  variant: FeedbackVariant;
  title: string;
  message: string;
  icon?: IconName;
  primaryAction?: FeedbackAction;
  secondaryAction?: FeedbackAction;
  loading?: boolean;
  ariaLive?: FeedbackAriaLive;
  headingLevel?: 1 | 2;
  className?: string;
}

const defaultIcons: Record<FeedbackVariant, IconName> = {
  error: 'warning',
  empty: 'bag',
  offline: 'wifi-off',
  timeout: 'clock',
  maintenance: 'warning',
  success: 'bag',
};

export function FeedbackState({
  variant,
  title,
  message,
  icon = defaultIcons[variant],
  primaryAction,
  secondaryAction,
  loading = false,
  ariaLive = variant === 'error' || variant === 'offline' || variant === 'timeout' ? 'assertive' : 'polite',
  headingLevel = 1,
  className = '',
}: FeedbackStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const role = ariaLive === 'assertive' ? 'alert' : 'status';
  return (
    <section
      className={['hly-feedback-state', `hly-feedback-state--${variant}`, className].filter(Boolean).join(' ')}
      role={role}
      aria-live={ariaLive}
      aria-busy={loading || undefined}
    >
      <span className="hly-feedback-state__icon" aria-hidden="true"><Icon name={icon} size={38} /></span>
      <Heading>{title}</Heading>
      <p>{message}</p>
      {primaryAction || secondaryAction ? (
        <div className="hly-feedback-state__actions">
          {primaryAction ? (
            <button
              className="hly-feedback-state__primary"
              type="button"
              onClick={primaryAction.onAction}
              disabled={loading}
              aria-label={primaryAction.ariaLabel}
            >
              {primaryAction.icon ? <Icon name={primaryAction.icon} size={20} /> : null}
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            <button
              className="hly-feedback-state__secondary"
              type="button"
              onClick={secondaryAction.onAction}
              disabled={loading}
              aria-label={secondaryAction.ariaLabel}
            >
              {secondaryAction.icon ? <Icon name={secondaryAction.icon} size={20} /> : null}
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
