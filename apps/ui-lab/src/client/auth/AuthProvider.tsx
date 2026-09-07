'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { createMemorySessionStore, type SessionPort } from '@hielya/application/client-auth';

const AuthContext = createContext<SessionPort | null>(null);
/** Per application mount, never a server-shared singleton. No cookie/storage/session replay integration. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createMemorySessionStore());
  useEffect(() => {
    const timer = setInterval(() => { if (!store.read()) store.clear(); }, 1000);
    return () => clearInterval(timer);
  }, [store]);
  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}
export function useAuthSessionPort() {
  const store = useContext(AuthContext);
  if (!store) throw new Error('Authentication provider is required.');
  return store;
}
/** Expose only authentication state to Home, never the token or customer's phone. */
export function useIsAuthenticated() {
  const store = useAuthSessionPort();
  return useSyncExternalStore(store.subscribe, () => Boolean(store.read()), () => false);
}
