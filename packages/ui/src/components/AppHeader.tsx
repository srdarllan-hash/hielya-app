import React from 'react';
import { IconButton } from './IconButton';
export function AppHeader({ cartCount=0 }: { cartCount?: number }) {
  return <header className="hly-app-header">
    <div className="hly-brand" aria-label="HIELYA, Lo quieres frío. Lo quieres ya.">
      <div className="hly-brand__word"><span className="hly-brand__snow">❄</span>HIELY<span className="hly-brand__bolt">A</span></div>
      <div className="hly-brand__tagline">Lo quieres frío. Lo quieres <strong>ya.</strong></div>
    </div>
    <div className="hly-app-header__actions">
      <IconButton icon="user" label="Abrir perfil" />
      <IconButton icon="cart" label="Abrir carrito" badge={cartCount}/>
    </div>
  </header>;
}
