import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { StoreAvailability } from '../../packages/application/src/orders/store-availability';
import { createStoreStateHandler } from '../../apps/ui-lab/src/server/mvp-local-36/store-state';
import { createAvailabilitySession, fetchAvailability, parseAvailability } from '../../apps/ui-lab/src/client/mvp-local-36/store-availability';
import { HomeCatalogRuntime } from '../../apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime';
import type { Availability } from '../../packages/application/src/orders';
import type { CatalogQueryPort, PublicProduct } from '../../packages/application/src';
const contract = JSON.parse(readFileSync('contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml','utf8'));
const example = (name: string): Availability => structuredClone(contract.paths['/store/state'].get.responses['200'].content['application/json'].examples[name].value);
const normal = () => example('normal45');
const high = () => example('high60-and-alcohol-blocked');
const server = (now: string, a = normal()) => new StoreAvailability({read:async()=>a},()=>now,()=> '11111111-1111-4111-8111-111111111111');
afterEach(()=> {cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('C005 authoritative alcohol integration',()=>{
 it.each([['2026-09-07T21:14:59+02:00',45,'AVAILABLE'],['2026-09-07T21:15:00+02:00',45,'UNAVAILABLE'],['2026-09-07T20:59:59+02:00',60,'AVAILABLE'],['2026-09-07T21:00:00+02:00',60,'UNAVAILABLE']])('server boundary %s SLA%s',async(now,sla,status)=>{
  const a=normal();a.demand.level=sla===60?'HIGH':'NORMAL';a.demand.estimate={...a.demand.estimate!,calculatedAt:'2026-09-07T20:00:00+02:00',validUntil:'2026-09-07T21:20:00+02:00',upperBoundMinutes:Number(sla)};
  const result=await server(String(now),a).read();expect(result.availability.alcohol.status).toBe(status);
  if(status==='AVAILABLE')expect(result.refreshAfterMs).toBe(1000);
 });
 it('keeps HIGH and cutoff unavailable simultaneous',async()=>{
  const result=await server('2026-09-07T21:01:00+02:00',high()).read();
  expect(result.availability.demand.level).toBe('HIGH');expect(result.availability.alcohol.reason).toBe('CUTOFF_REACHED');
 });
 it('expired estimate never falls back to optimistic 45 minutes',async()=>{
  const result=await server('2026-09-07T21:01:00+02:00').read();expect(result.availability.alcohol.reason).toBe('SLA_UNAVAILABLE');expect(result.availability.alcohol.snapshot).toBeNull();
 });
 it('public handler exposes no-store and server lease, and fails closed when unconfigured',async()=>{
  const response=await createStoreStateHandler(server('2026-09-07T20:00:00+02:00'))();expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');expect(response.headers.get('x-hielya-refresh-after-ms')).toBe('15000');
  const failed=await createStoreStateHandler(new StoreAvailability({read:async()=>{throw Error('secret');}},()=>'',()=>''))();expect(failed.status).toBe(503);expect(await failed.json()).toEqual({code:'SERVICE_UNAVAILABLE',message:'Operational state unavailable.',currentAvailability:null});
 });
 it('purchase guard loads authoritative product alcohol flag, including packs, and rechecks current cutoff',async()=>{
  const catalog={findPublicProductById:async(id:string)=>({containsAlcohol:id!=='water',availability:'AVAILABLE'})} as unknown as CatalogQueryPort;
  const service=server('2026-09-07T21:01:00+02:00',high());
  for(const id of ['beer','pack'])await expect(service.assertProducts([id],catalog)).rejects.toThrow('CUTOFF_REACHED');
  await expect(service.assertProducts(['water'],catalog)).resolves.toMatchObject({storeStatus:'OPEN'});
  await expect(service.assertProducts([],catalog)).rejects.toThrow('EMPTY_PURCHASE_INTENT');
 });
 it('rejects malformed available payloads and invalid freshness metadata',async()=>{
  expect(()=>parseAvailability({...normal(),alcohol:{status:'AVAILABLE',reason:'ELIGIBLE',snapshot:null}})).toThrow();
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json(normal())));await expect(fetchAvailability(new AbortController().signal)).rejects.toThrow('INVALID_LEASE');
 });
 it('deducts network time and never relies on browser wall clock for policy',async()=>{
  vi.spyOn(performance,'now').mockReturnValueOnce(10).mockReturnValueOnce(1010);
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json(normal(),{headers:{'x-hielya-refresh-after-ms':'1000'}})));
  await expect(fetchAvailability(new AbortController().signal)).rejects.toThrow('EXPIRED_LEASE');
 });
 it('expires permission during session and fetches new server decision before allowing an action',async()=>{
  vi.useFakeTimers();let now=0;vi.spyOn(performance,'now').mockImplementation(()=>now);
  let calls=0;const session=createAvailabilitySession(async()=>({availability:++calls===1?normal():high(),expiresAt:now+1000}));
  await session.refresh();expect(session.current()?.alcohol.status).toBe('AVAILABLE');now=1000;
  expect(session.current()).toBeUndefined();await vi.advanceTimersByTimeAsync(1000);
  expect(session.current()?.alcohol.status).toBe('UNAVAILABLE');expect(await session.allow(true)).toBe(false);expect(await session.allow(false)).toBe(true);session.stop();
 });
 it('ignores a late old response, fails closed on network error, and cancels timers on stop',async()=>{
  vi.useFakeTimers();let resolve!:(x:{availability:Availability;expiresAt:number})=>void;let calls=0;
  const session=createAvailabilitySession(async()=>++calls===1?new Promise(r=>{resolve=r;}):{availability:high(),expiresAt:performance.now()+1000});
  const first=session.refresh();await session.refresh();resolve({availability:normal(),expiresAt:performance.now()+1000});await first;
  expect(session.current()?.alcohol.status).toBe('UNAVAILABLE');session.stop();await vi.advanceTimersByTimeAsync(10000);expect(calls).toBe(2);
  const failed=createAvailabilitySession(async()=>{throw Error('offline');});expect(await failed.allow(true)).toBe(false);failed.stop();
 });
 it('renders concurrent notices, blocks alcoholic cards, preserves nonalcohol and product browsing',async()=>{
  const product={id:'beer',sku:'beer',name:'Beer',categoryId:'category',salePriceCents:300,currency:'EUR',availability:'AVAILABLE',isPack:false,iceIncluded:false,maxPerOrder:5,containsAlcohol:true} as PublicProduct;
  const products=[product,{...product,id:'water',name:'Water',containsAlcohol:false}];
  const client={listCategories:async()=>({data:[],correlationId:null}),listProducts:async()=>({data:{items:products,page:1,pageSize:20,total:2},correlationId:null})};
  await act(async()=>{render(<HomeCatalogRuntime client={client} availabilityClient={async()=>({availability:high(),expiresAt:performance.now()+15000})}/>);});
  expect(screen.getByText(/Alta demanda/)).toBeInTheDocument();expect(screen.getByText(/Alcohol no disponible después de las 21:00 hoy/)).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Beer no disponible'})).toBeDisabled();expect(screen.getByRole('button',{name:'Ver detalles de Beer'})).toBeEnabled();
  const listener=vi.fn();window.addEventListener('hielya:ui-action',listener);
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Añadir Water al carrito'}));});
  expect(listener).toHaveBeenCalledTimes(1);window.removeEventListener('hielya:ui-action',listener);
 });
});
