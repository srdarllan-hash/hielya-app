'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Availability } from '../../../../../packages/application/src/orders';

export interface AvailabilityLease { availability: Availability; expiresAt: number }
export type AvailabilityClient = (signal: AbortSignal) => Promise<AvailabilityLease>;
const instant = (s: unknown): s is string => typeof s === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(s) && Number.isFinite(Date.parse(s));
export function parseAvailability(value: unknown): Availability {
  const a = value as Availability;
  if (!a || !['OPEN','PAUSED','CLOSED'].includes(a.storeStatus) || !a.demand || !['HIGH','NORMAL','UNKNOWN'].includes(a.demand.level) || !a.alcohol || !['AVAILABLE','UNAVAILABLE'].includes(a.alcohol.status) || !['ELIGIBLE','CUTOFF_REACHED','STORE_NOT_OPEN','SLA_UNAVAILABLE'].includes(a.alcohol.reason)) throw new Error('INVALID_AVAILABILITY');
  const estimate = a.demand.estimate;
  if (a.demand.level !== 'UNKNOWN' && (!estimate || !estimate.estimateId || !estimate.version || !estimate.source || !instant(estimate.calculatedAt) || !instant(estimate.validUntil) || !Number.isSafeInteger(estimate.minimumMinutes) || estimate.minimumMinutes <= 0 || !Number.isSafeInteger(estimate.upperBoundMinutes) || estimate.upperBoundMinutes < estimate.minimumMinutes)) throw new Error('INVALID_ESTIMATE');
  if (a.demand.level === 'UNKNOWN' && estimate !== null) throw new Error('INVALID_ESTIMATE');
  const snapshot = a.alcohol.snapshot;
  if (snapshot !== null && (!snapshot || !snapshot.decisionId || snapshot.policyVersion !== 'alcohol-v1.3' || snapshot.timezone !== 'Europe/Madrid' || snapshot.standardSlaMinutes !== 45 || !Number.isSafeInteger(snapshot.effectiveSlaMinutes) || snapshot.effectiveSlaMinutes < 45 || !instant(snapshot.alcoholOrderCutoffAt) || !instant(snapshot.alcoholHandoverDeadlineAt) || JSON.stringify(snapshot.estimate) !== JSON.stringify(estimate))) throw new Error('INVALID_SNAPSHOT');
  if (a.alcohol.status === 'AVAILABLE' && (a.alcohol.reason !== 'ELIGIBLE' || a.storeStatus !== 'OPEN' || a.demand.level === 'UNKNOWN' || !snapshot)) throw new Error('INVALID_ELIGIBILITY');
  if (a.alcohol.status === 'UNAVAILABLE' && a.alcohol.reason === 'ELIGIBLE') throw new Error('INVALID_ELIGIBILITY');
  if (a.alcohol.reason === 'CUTOFF_REACHED' && !snapshot) throw new Error('INVALID_SNAPSHOT');
  return a;
}
export const fetchAvailability: AvailabilityClient = async signal => {
  // Monotonic request-start time deducts network latency; browser wall clock is never a policy clock.
  const started = performance.now();
  const response = await fetch('/api/v1/store/state', { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('AVAILABILITY_UNAVAILABLE');
  const raw = response.headers.get('x-hielya-refresh-after-ms');
  const ttl = Number(raw);
  if (raw === null || !Number.isFinite(ttl) || ttl <= 0 || ttl > 15_000) throw new Error('INVALID_LEASE');
  const availability = parseAvailability(await response.json());
  const expiresAt = started + ttl;
  if (performance.now() >= expiresAt) throw new Error('EXPIRED_LEASE');
  return { availability, expiresAt };
};
export function createAvailabilitySession(client: AvailabilityClient = fetchAvailability) {
  let lease: AvailabilityLease | undefined;
  let sequence = 0;
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach(fn => fn());
  const current = () => lease && performance.now() < lease.expiresAt ? lease.availability : undefined;
  const refresh = async () => {
    const version = ++sequence;
    clearTimeout(timer); controller?.abort(); controller = new AbortController();
    const active = controller;
    const timeout = setTimeout(() => active.abort(), 5000);
    lease = undefined; publish();
    try {
      const next = await client(active.signal);
      if (version !== sequence || active.signal.aborted) return undefined;
      if (performance.now() >= next.expiresAt) throw new Error('EXPIRED_LEASE');
      lease = next; publish();
      timer = setTimeout(() => void refresh(), Math.max(0,next.expiresAt-performance.now()));
      return current();
    } catch {
      if (version === sequence) { lease = undefined; publish(); timer = setTimeout(() => void refresh(),5000); }
      return undefined;
    } finally { clearTimeout(timeout); }
  };
  return {
    current, refresh,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    async allow(containsAlcohol: boolean) {
      const state = await refresh();
      return Boolean(state && current() === state && state.storeStatus === 'OPEN' && (!containsAlcohol || state.alcohol.status === 'AVAILABLE'));
    },
    stop() { sequence++; controller?.abort(); clearTimeout(timer); lease = undefined; },
  };
}
export function useStoreAvailability(client: AvailabilityClient = fetchAvailability) {
  const session = useMemo(() => createAvailabilitySession(client), [client]);
  const [availability,setAvailability] = useState<Availability>();
  useEffect(() => {
    const off = session.subscribe(() => setAvailability(session.current()));
    const resume = () => { if (document.visibilityState === 'visible') void session.refresh(); };
    document.addEventListener('visibilitychange',resume); window.addEventListener('focus',resume);
    void session.refresh();
    return () => { off(); session.stop(); document.removeEventListener('visibilitychange',resume); window.removeEventListener('focus',resume); };
  },[session]);
  return { availability, session };
}
