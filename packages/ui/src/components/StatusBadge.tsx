import React from 'react';
export type StatusTone = 'neutral'|'success'|'warning'|'danger'|'info';
export function StatusBadge({ children, tone='neutral' }: { children: React.ReactNode; tone?: StatusTone }) {
  return <span className={`hly-status-badge hly-status-badge--${tone}`}>{children}</span>;
}
