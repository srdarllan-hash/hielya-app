import React from 'react';
import { Icon } from '../icons/Icon';

export interface HeroBannerProps {
  image: string;
  title?: React.ReactNode;
  description?: string;
  ariaLabel?: string;
}

export function HeroBanner({
  image,
  title = <>Frío de verdad.<br /><em>En minutos.</em></>,
  description = 'Estimación actualizada antes de pagar.',
  ariaLabel = 'Bebidas frías y entrega local',
}: HeroBannerProps) {
  const style = { '--hly-hero-image': `url("${image}")` } as React.CSSProperties;
  return (
    <section className="hly-hero" style={style} aria-label={ariaLabel}>
      <div className="hly-hero__copy">
        <h1>{title}</h1>
        <p><Icon name="bolt" size={20} /> {description}</p>
      </div>
    </section>
  );
}
