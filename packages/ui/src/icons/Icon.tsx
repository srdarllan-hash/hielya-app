import React from 'react';
export type IconName = 'location'|'clock'|'scooter'|'bag'|'search'|'filter'|'user'|'cart'|'home'|'grid'|'orders'|'plus'|'arrow-right'|'snowflake'|'warning'|'refresh'|'wifi-off'|'close'|'bolt'|'chevron-right';
export interface IconProps { name: IconName; size?: number; className?: string; }
const paths: Record<IconName, React.ReactNode> = {
  location: <g><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></g>,
  clock: <g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></g>,
  scooter: <g><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h5l2-5h-5l-2-5H6M15.5 12h3l-2-4h-2"/></g>,
  bag: <g><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></g>,
  search: <g><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></g>,
  filter: <g><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="12" cy="18" r="1"/></g>,
  user: <g><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></g>,
  cart: <g><path d="M3 4h2l2 11h10l2-7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></g>,
  home: <g><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></g>,
  grid: <g><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></g>,
  orders: <g><path d="M7 4h10v17H7z"/><path d="M9 2h6v4H9zM9 10h6M9 14h6"/></g>,
  plus: <g><path d="M12 5v14M5 12h14"/></g>,
  'arrow-right': <g><path d="M5 12h14M14 7l5 5-5 5"/></g>,
  'chevron-right': <g><path d="m9 6 6 6-6 6"/></g>,
  snowflake: <g><path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5l-15.6 11"/><path d="m9 4 3 3 3-3M9 20l3-3 3 3M5 9l4 .5-.5-4M19 15l-4-.5.5 4M19 9l-4 .5.5-4M5 15l4-.5-.5 4"/></g>,
  warning: <g><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/></g>,
  refresh: <g><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 11A7 7 0 0 0 6 7M5.5 13A7 7 0 0 0 18 17"/></g>,
  'wifi-off': <g><path d="M2 8.5a16 16 0 0 1 4-2.4M22 8.5a16 16 0 0 0-10.3-3.4M5 12a11 11 0 0 1 5-2M19 12a11 11 0 0 0-2.3-1.3M8.5 15.5a5 5 0 0 1 5-1M12 20h.01M3 3l18 18"/></g>,
  close: <g><path d="m6 6 12 12M18 6 6 18"/></g>,
  bolt: <g><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></g>,
};
export function Icon({ name, size=24, className }: IconProps) {
  return <svg className={className} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
