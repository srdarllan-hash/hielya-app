'use client';
import type { ReactNode } from 'react';
import { useIsAuthenticated } from './AuthProvider';

/** TEMPORARY PURCHASE INTEGRATION: consume in-memory authentication without adding checkout or gating catalog. */
export function AuthHomeRuntime({ children }: { children: ReactNode }) {
  const authenticated = useIsAuthenticated();
  return <div data-authenticated={authenticated ? 'true' : 'false'}>{children}</div>;
}
