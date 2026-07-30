import React from 'react';
export function CategoryChip({ label, image, active=false, disabled=false }: { label: string; image: string; active?: boolean; disabled?: boolean }) {
  return <button type="button" className={`hly-category-chip${active?' is-active':''}`} aria-pressed={active} disabled={disabled}>
    <span className="hly-category-chip__visual"><img src={image} alt="" /></span><span>{label}</span>
  </button>;
}
