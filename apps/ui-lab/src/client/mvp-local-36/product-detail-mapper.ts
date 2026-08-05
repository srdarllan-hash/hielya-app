import type {
  ProductDetailBundleComponentViewModel,
  ProductDetailViewModel,
} from '@hielya/ui';

import type {
  PublicBundleComponentDto,
  PublicProductDto,
} from './catalog-contracts';

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const temperatureLabels: Record<
  NonNullable<PublicProductDto['temperatureProfile']>,
  string
> = {
  CHILLED: 'Frío',
  FROZEN: 'Congelado',
  CELLAR: 'Bodega',
  AMBIENT: 'Ambiente',
};

const mapBundleComponent = (
  component: PublicBundleComponentDto,
): ProductDetailBundleComponentViewModel => ({
  productId: component.productId,
  sku: component.sku,
  name: component.name,
  quantity: component.quantity,
});

export const mapPublicProductToDetail = (
  product: PublicProductDto,
): ProductDetailViewModel => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  description: product.description ?? null,
  brand: product.brand ?? null,
  price: euroFormatter.format(product.salePriceCents / 100),
  unitPriceLabel: product.unitPriceLabel ?? null,
  volumeLabel: product.volumeLabel ?? null,
  image: product.imageUrl ?? null,
  availability: product.availability,
  isPack: product.isPack,
  iceIncluded: product.iceIncluded,
  maxPerOrder: product.maxPerOrder,
  containsAlcohol: product.containsAlcohol,
  minimumAge: product.minimumAge ?? null,
  alcoholPercentage: product.alcoholPercentage ?? null,
  temperatureLabel: product.temperatureProfile
    ? temperatureLabels[product.temperatureProfile]
    : null,
  readyToConsume: product.readyToConsume ?? null,
  bundleComponents: (product.bundleComponents ?? []).map(mapBundleComponent),
});
