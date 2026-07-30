declare global {
  // Preview runtime injects data URIs. Next.js uses /assets paths.
  // eslint-disable-next-line no-var
  var __HIELYA_ASSET_MAP__: Record<string, string> | undefined;
}
export function asset(path: string): string {
  return globalThis.__HIELYA_ASSET_MAP__?.[path] ?? `/assets/${path}`;
}
