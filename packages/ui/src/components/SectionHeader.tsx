import React from 'react';
export function SectionHeader({ id, title, action='Ver todos' }: { id?:string; title: string; action?: string }) {
  return <div className="hly-section-header"><h2 id={id}>{title}</h2><button type="button">{action}</button></div>;
}
