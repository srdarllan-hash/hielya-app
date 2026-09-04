import type {
  HomeCatalogViewModel,
  HomeCategoryViewModel,
  HomePackComponentViewModel,
  HomePackViewModel,
  HomeUnitProductViewModel,
} from '@hielya/ui';

import type {
  PublicBundleComponentDto,
  PublicCategoryDto,
  PublicProductDto,
  PublicProductPageDto,
} from './catalog-contracts';

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrice = (product: PublicProductDto): string => (
  euroFormatter.format(product.salePriceCents / 100)
);

const mapCategory = (category: PublicCategoryDto): HomeCategoryViewModel => ({
  id: category.id,
  label: category.name,
  image: category.imageUrl ?? null,
});

const mapUnitProduct = (product: PublicProductDto): HomeUnitProductViewModel => ({
  kind: 'UNIT',
  id: product.id,
  name: product.name,
  price: formatPrice(product),
  volumeLabel: product.volumeLabel ?? null,
  image: product.imageUrl ?? null,
  availability: product.availability,
  containsAlcohol: product.containsAlcohol,
  minimumAge: product.minimumAge ?? null,
});

const mapPackComponent = (
  component: PublicBundleComponentDto,
): HomePackComponentViewModel => ({
  productId: component.productId,
  name: component.name,
  quantity: component.quantity,
});

const mapPack = (product: PublicProductDto): HomePackViewModel => ({
  kind: 'PACK',
  id: product.id,
  name: product.name,
  price: formatPrice(product),
  image: product.imageUrl ?? null,
  discountLabel: null,
  availability: product.availability,
  iceIncluded: product.iceIncluded,
  containsAlcohol: product.containsAlcohol,
  minimumAge: product.minimumAge ?? null,
  components: (product.bundleComponents ?? []).map(mapPackComponent),
});

export const mapPublicCategories = (
  categories: readonly PublicCategoryDto[],
): readonly HomeCategoryViewModel[] => categories.map(mapCategory);

export const mapPublicProductPage = (
  page: PublicProductPageDto,
  categories: readonly HomeCategoryViewModel[],
): HomeCatalogViewModel => {
  const unitProducts: HomeUnitProductViewModel[] = [];
  const packs: HomePackViewModel[] = [];

  for (const product of page.items) {
    if (product.isPack) {
      packs.push(mapPack(product));
    } else {
      unitProducts.push(mapUnitProduct(product));
    }
  }

  return {
    categories,
    unitProducts,
    packs,
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
  };
};

export const mapPublicCatalog = (
  categories: readonly PublicCategoryDto[],
  page: PublicProductPageDto,
): HomeCatalogViewModel => mapPublicProductPage(page, mapPublicCategories(categories));
