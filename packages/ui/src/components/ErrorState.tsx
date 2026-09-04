import React from 'react';
import { FeedbackState } from './FeedbackState';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
}

export function ErrorState({
  title = 'No pudimos cargar la tienda',
  message = 'Revisa tu conexión e inténtalo de nuevo.',
  action = 'Reintentar',
  onAction,
  loading = false,
}: ErrorStateProps) {
  return (
    <FeedbackState
      variant="offline"
      title={title}
      message={message}
      loading={loading}
      primaryAction={onAction ? { label: action, onAction, icon: 'refresh' } : undefined}
    />
  );
}
