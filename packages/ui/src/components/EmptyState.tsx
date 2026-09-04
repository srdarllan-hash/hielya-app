import React from 'react';
import { FeedbackState } from './FeedbackState';

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
}

export function EmptyState({ title, message, action, onAction, loading = false }: EmptyStateProps) {
  return (
    <FeedbackState
      variant="empty"
      title={title}
      message={message}
      headingLevel={2}
      loading={loading}
      primaryAction={action && onAction ? { label: action, onAction } : undefined}
    />
  );
}
