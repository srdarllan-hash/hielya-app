import React from 'react';
import { Icon, type IconName } from '../icons/Icon';
const items: {label:string;icon:IconName}[]=[{label:'Inicio',icon:'home'},{label:'Categorías',icon:'grid'},{label:'Buscar',icon:'search'},{label:'Pedidos',icon:'orders'},{label:'Perfil',icon:'user'}];
export function BottomNavigation({ active='Inicio' }: { active?: string }) {
  return <nav className="hly-bottom-nav" aria-label="Navegación principal">{items.map((item)=><button type="button" key={item.label} className={item.label===active?'is-active':''} aria-current={item.label===active?'page':undefined}><Icon name={item.icon}/><span>{item.label}</span></button>)}</nav>;
}
