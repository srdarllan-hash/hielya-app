import React from 'react';

export type BrandLockupSize = 'sm' | 'md' | 'lg';
export type BrandLockupAlign = 'start' | 'center';

export interface BrandLockupProps {
  size?: BrandLockupSize;
  align?: BrandLockupAlign;
  showTagline?: boolean;
  ariaLabel?: string;
  tagline?: React.ReactNode;
  className?: string;
}

export function BrandLockup({
  size = 'md',
  align = 'start',
  showTagline = true,
  ariaLabel = 'HIELYA, Lo quieres frío. Lo quieres ya.',
  tagline = <>Lo quieres frío. Lo quieres <strong>ya.</strong></>,
  className = '',
}: BrandLockupProps) {
  const classes = [
    'hly-brand',
    `hly-brand--${size}`,
    `hly-brand--${align}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="img" aria-label={ariaLabel}>
      <div aria-hidden="true">
        <div className="hly-brand__word">
          <span className="hly-brand__snow">❄</span>
          HIELY<span className="hly-brand__bolt">A</span>
        </div>
        {showTagline ? <div className="hly-brand__tagline">{tagline}</div> : null}
      </div>
    </div>
  );
}
