import React from 'react';
import { Icon } from '../icons/Icon';
export function PackCard({ name, description, price, discount, image, disabled=false }: { name:string;description:string[];price:string;discount:string;image:string;disabled?:boolean }) {
  return <article className={`hly-pack-card${disabled?' is-disabled':''}`}>
    <img src={image} alt=""/><div className="hly-pack-card__copy"><h3>{name}</h3>{description.map((line)=><p key={line}>• {line}</p>)}<div><strong>{price}</strong><span>{discount}</span></div></div><button type="button" aria-label={`Añadir ${name} al carrito`} disabled={disabled}><Icon name="plus" size={20}/></button>
  </article>;
}
