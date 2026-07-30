import React from 'react';
import { Icon } from '../icons/Icon';
export function HeroBanner({ image }: { image: string }) {
  return <section className="hly-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.96) 0%, rgba(0,0,0,.82) 43%, rgba(0,0,0,.08) 100%), url(${image})` }} aria-label="Bebidas frías y entrega local">
    <div className="hly-hero__copy"><h1>Frío de verdad.<br/><em>En minutos.</em></h1><p><Icon name="bolt" size={20}/> Estimación actualizada antes de pagar.</p></div>
  </section>;
}
