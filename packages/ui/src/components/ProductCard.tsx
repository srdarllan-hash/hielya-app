import React from 'react';
import { Icon } from '../icons/Icon';
import { StatusBadge } from './StatusBadge';
export interface ProductCardProps { name:string; size:string; price:string; image:string; unavailable?:boolean; lowStock?:boolean; disabled?:boolean; }
export function ProductCard({ name,size,price,image,unavailable=false,lowStock=false,disabled=false }: ProductCardProps) {
  const blocked=unavailable||disabled;
  return <article className={`hly-product-card${blocked?' is-disabled':''}`}>
    <div className="hly-product-card__image"><img src={image} alt={`${name} ${size}`} /></div>
    <div className="hly-product-card__body"><h3>{name}</h3><p>{size}</p>{lowStock?<StatusBadge tone="warning">Últimas unidades</StatusBadge>:null}<div className="hly-product-card__footer"><strong>{price}</strong><button type="button" aria-label={blocked?`${name} no disponible`:`Añadir ${name} al carrito`} disabled={blocked}><Icon name={blocked?'close':'plus'} size={20}/></button></div></div>
  </article>;
}
