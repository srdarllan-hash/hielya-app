'use client';

import React from 'react';
import { Icon, type IconName } from '../icons/Icon';

export type BottomNavigationItemId = 'home' | 'categories' | 'search' | 'orders' | 'profile';
export interface BottomNavigationItem { id: BottomNavigationItemId; label: string; icon: IconName; }

export const bottomNavigationItems: BottomNavigationItem[] = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'categories', label: 'Categorías', icon: 'grid' },
  { id: 'search', label: 'Buscar', icon: 'search' },
  { id: 'orders', label: 'Pedidos', icon: 'orders' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
];

export interface BottomNavigationProps {
  active?: BottomNavigationItemId;
  items?: BottomNavigationItem[];
  onNavigate?: (item: BottomNavigationItem) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function BottomNavigation({
  active = 'home',
  items = bottomNavigationItems,
  onNavigate,
  disabled = false,
  ariaLabel = 'Navegación principal',
}: BottomNavigationProps) {
  return (
    <nav className="hly-bottom-nav" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={item.id === active ? 'is-active' : ''}
          aria-current={item.id === active ? 'page' : undefined}
          disabled={disabled || !onNavigate}
          onClick={() => onNavigate?.(item)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
