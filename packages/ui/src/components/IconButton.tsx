import React from 'react';
import { Icon, type IconName } from '../icons/Icon';
export function IconButton({ icon, label, badge, onClick, disabled=false }: { icon: IconName; label: string; badge?: number; onClick?: () => void; disabled?: boolean }) {
  return <button className="hly-icon-button" type="button" aria-label={label} onClick={onClick} disabled={disabled}>
    <Icon name={icon}/>{badge && badge > 0 ? <span className="hly-icon-button__badge" aria-label={`${badge} artículos`}>{badge}</span> : null}
  </button>;
}
