import { describe, expect, it } from 'vitest';

import type { PublicProductDto } from '../../apps/ui-lab/src/client/mvp-local-36/catalog-contracts';
import { mapPublicProductToDetail } from '../../apps/ui-lab/src/client/mvp-local-36/product-detail-mapper';

const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const COMPONENT_ID = '33333333-3333-4333-8333-333333333333';
const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

describe('product-detail public DTO mapper', () => {
  it('maps the DTO field by field into a stable detail view model', () => {
    const dto: PublicProductDto = {
      id: PRODUCT_ID,
      sku: 'SYN-PACK-001',
      name: 'Pack sintético',
      description: 'Descripción pública',
      brand: 'Marca sintética',
      categoryId: CATEGORY_ID,
      volumeLabel: '4 × 330 ml',
      salePriceCents: 1250,
      currency: 'EUR',
      unitPriceLabel: '9,47 €/l',
      availability: 'AVAILABLE',
      isPack: true,
      iceIncluded: true,
      maxPerOrder: 2,
      temperatureProfile: 'CHILLED',
      readyToConsume: true,
      containsAlcohol: true,
      minimumAge: 18,
      alcoholPercentage: 5,
      imageUrl: 'https://example.invalid/synthetic-pack.svg',
      bundleComponents: [{
        productId: COMPONENT_ID,
        sku: 'SYN-COMPONENT-001',
        name: 'Componente sintético',
        quantity: 4,
      }],
    };

    expect(mapPublicProductToDetail(dto)).toEqual({
      id: PRODUCT_ID,
      sku: 'SYN-PACK-001',
      name: 'Pack sintético',
      description: 'Descripción pública',
      brand: 'Marca sintética',
      price: '12,50 €',
      unitPriceLabel: '9,47 €/l',
      volumeLabel: '4 × 330 ml',
      image: 'https://example.invalid/synthetic-pack.svg',
      availability: 'AVAILABLE',
      isPack: true,
      iceIncluded: true,
      maxPerOrder: 2,
      containsAlcohol: true,
      minimumAge: 18,
      alcoholPercentage: 5,
      temperatureLabel: 'Frío',
      readyToConsume: true,
      bundleComponents: [{
        productId: COMPONENT_ID,
        sku: 'SYN-COMPONENT-001',
        name: 'Componente sintético',
        quantity: 4,
      }],
    });
  });

  it('does not copy newly added internal fields into product or component output', () => {
    const dto = {
      id: PRODUCT_ID,
      sku: 'SYN-PACK-002',
      name: 'Pack con frontera estricta',
      categoryId: CATEGORY_ID,
      salePriceCents: 900,
      currency: 'EUR',
      availability: 'TEMPORARILY_UNAVAILABLE',
      isPack: true,
      iceIncluded: true,
      maxPerOrder: 1,
      containsAlcohol: false,
      physicalStock: 100,
      purchaseCost: 1,
      bundleComponents: [{
        productId: COMPONENT_ID,
        sku: 'SYN-COMPONENT-002',
        name: 'Componente aislado',
        quantity: 1,
        reservedStock: 20,
      }],
    } as unknown as PublicProductDto;

    const viewModel = mapPublicProductToDetail(dto);

    expect(Object.keys(viewModel)).toEqual([
      'id',
      'sku',
      'name',
      'description',
      'brand',
      'price',
      'unitPriceLabel',
      'volumeLabel',
      'image',
      'availability',
      'isPack',
      'iceIncluded',
      'maxPerOrder',
      'containsAlcohol',
      'minimumAge',
      'alcoholPercentage',
      'temperatureLabel',
      'readyToConsume',
      'bundleComponents',
    ]);
    expect(Object.keys(viewModel.bundleComponents[0] ?? {})).toEqual([
      'productId',
      'sku',
      'name',
      'quantity',
    ]);
    expect(JSON.stringify(viewModel)).not.toMatch(
      /physicalStock|reservedStock|purchaseCost|inventoryBatch|margin/i,
    );
  });
});
