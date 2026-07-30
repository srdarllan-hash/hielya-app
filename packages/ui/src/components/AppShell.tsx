import React from 'react';
export function AppShell({ children, state }: { children: React.ReactNode; state?: string }) {
  return <div className="hly-app-shell" data-home-state={state}>{children}</div>;
}
