declare global {
  // Preview runtime injects data URIs. Next.js uses /assets paths.
  // eslint-disable-next-line no-var
  var __HIELYA_ASSET_MAP__: Record<string, string> | undefined;
}

export const assetAliases: Readonly<Record<string, string>> = Object.freeze({
  'categories/victoria.svg': 'shared/victoria.svg',
  'products/victoria.svg': 'shared/victoria.svg',
  'categories/redbull.svg': 'shared/redbull.svg',
  'products/redbull.svg': 'shared/redbull.svg',
  'categories/ice-bag.svg': 'shared/ice-bag.svg',
  'products/ice-bag.svg': 'shared/ice-bag.svg',
});

export function canonicalAssetPath(path: string): string {
  return assetAliases[path] ?? path;
}

export function asset(path: string): string {
  const canonicalPath = canonicalAssetPath(path);
  return globalThis.__HIELYA_ASSET_MAP__?.[canonicalPath]
    ?? globalThis.__HIELYA_ASSET_MAP__?.[path]
    ?? `/assets/${canonicalPath}`;
}
