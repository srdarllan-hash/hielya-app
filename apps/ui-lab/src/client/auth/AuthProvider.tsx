'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { createMemorySessionStore, type SessionPort } from '@hielya/application/client-auth';

import { restoreSession } from './otp-client';

const AuthContext = createContext<SessionPort | null>(null);
/** Per application mount, never a server-shared singleton. Hydrates authentication state through the server-owned cookie. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createMemorySessionStore());
  useEffect(() => {
    const controller = new AbortController();
    const started = Date.now();
    let changed = false;
    const unsubscribe = store.subscribe(() => { changed = true; });
    void restoreSession(controller.signal).then(session => {
      if (controller.signal.aborted || changed) return;
      if (session) store.write({ customer: session.customer, expiresAt: started + session.expiresInSeconds * 1000 });
    }).catch(() => { /* Unavailable hydration leaves the cache unauthenticated. */ });
    const timer = setInterval(() => { if (!store.read()) store.clear(); }, 1000);
    return () => { controller.abort(); unsubscribe(); clearInterval(timer); };
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
