'use client';

import React from 'react';
import { BrandLockup } from './BrandLockup';
import { IconButton } from './IconButton';

export type AppHeaderVariant = 'home' | 'internal';

export interface AppHeaderProps {
  variant?: AppHeaderVariant;
  cartCount?: number;
  onProfile?: () => void;
  onCart?: () => void;
  profileDisabled?: boolean;
  cartDisabled?: boolean;
}

export function AppHeader({
  variant = 'home',
  cartCount = 0,
  onProfile,
  onCart,
  profileDisabled = false,
  cartDisabled = false,
}: AppHeaderProps) {
  return (
    <header className={`hly-app-header hly-app-header--${variant}`}>
      <BrandLockup size={variant === 'home' ? 'md' : 'sm'} showTagline={variant === 'home'} />
      <div className="hly-app-header__actions">
        <IconButton icon="user" label="Abrir perfil" onClick={onProfile} disabled={profileDisabled || !onProfile} />
        <IconButton icon="cart" label="Abrir carrito" badge={cartCount} onClick={onCart} disabled={cartDisabled || !onCart} />
      </div>
    </header>
  );
}
