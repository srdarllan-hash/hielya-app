import React from 'react';

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  screenState?: string;
}

export function AppShell({ children, screenState, className = '', ...rest }: AppShellProps) {
  const classes = ['hly-app-shell', className].filter(Boolean).join(' ');
  return (
    <div {...rest} className={classes} data-screen-state={screenState}>
      {children}
    </div>
  );
}
