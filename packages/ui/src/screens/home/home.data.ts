import { asset } from '../../lib/assets';
import type {
  HomeCatalogViewModel,
  HomeDeliverySummaryViewModel,
  HomeOperationalFactViewModel,
} from './home.types';

/**
 * Historical C-005 presentation fixture.
 *
 * This module is intentionally imported by Storybook only. Runtime Home composition must
 * receive data from the public HTTP catalog and must never use this fixture as a fallback.
 */
export const historicalHomeCatalogFixture: HomeCatalogViewModel = {
  categories: [
    { id: 'historical-cervezas', label: 'Cervezas', image: asset('categories/victoria.svg') },
    { id: 'historical-destilados', label: 'Destilados', image: asset('categories/whiskey.svg') },
    { id: 'historical-energeticos', label: 'Energéticos', image: asset('categories/redbull.svg') },
    { id: 'historical-hielo', label: 'Hielo', image: asset('categories/ice-bag.svg') },
    { id: 'historical-refrescos', label: 'Refrescos', image: asset('categories/cocacola.svg') },
    { id: 'historical-snacks', label: 'Snacks', image: asset('categories/lays.svg') },
  ],
  unitProducts: [
    { kind: 'UNIT', id: 'historical-victoria', name: 'Victoria Málaga', volumeLabel: '330 ml', price: '€1,40', image: asset('products/victoria.svg'), availability: 'AVAILABLE', containsAlcohol: true, minimumAge: 18 },
    { kind: 'UNIT', id: 'historical-estrella', name: 'Estrella Galicia', volumeLabel: '330 ml', price: '€1,50', image: asset('products/estrella.svg'), availability: 'AVAILABLE', containsAlcohol: true, minimumAge: 18 },
    { kind: 'UNIT', id: 'historical-redbull', name: 'Red Bull', volumeLabel: '250 ml', price: '€2,80', image: asset('products/redbull.svg'), availability: 'AVAILABLE', containsAlcohol: false },
    { kind: 'UNIT', id: 'historical-ice', name: 'Hielo en bolsa', volumeLabel: '2 kg', price: '€3,50', image: asset('products/ice-bag.svg'), availability: 'AVAILABLE', containsAlcohol: false },
  ],
  packs: [
    {
      kind: 'PACK',
      id: 'historical-pack-cervecero',
      name: 'Pack Cervecero',
      price: '€16,80',
      discountLabel: '−7%',
      image: asset('products/pack-cervecero.svg'),
      availability: 'AVAILABLE',
      iceIncluded: true,
      containsAlcohol: true,
      minimumAge: 18,
      components: [
        { productId: 'historical-estrella', name: 'Estrella Galicia 330 ml', quantity: 12 },
        { productId: 'historical-ice', name: 'Hielo en bolsa 2 kg', quantity: 1 },
      ],
    },
    {
      kind: 'PACK',
      id: 'historical-mix-energia',
      name: 'Mix Energía',
      price: '€15,90',
      discountLabel: '−10%',
      image: asset('products/mix-energia.svg'),
      availability: 'AVAILABLE',
      iceIncluded: false,
      containsAlcohol: false,
      components: [
        { productId: 'historical-redbull', name: 'Red Bull 250 ml', quantity: 6 },
        { productId: 'historical-cocacola', name: 'Coca-Cola 330 ml', quantity: 6 },
      ],
    },
  ],
  page: 1,
  pageSize: 20,
  total: 6,
};

export const historicalHomeDeliveryFixture: HomeDeliverySummaryViewModel = {
  blocked: false,
  eta: '30–45 min',
  addressLine: 'Paseo Marítimo Rey de España, 65',
  localityLine: '29640 Fuengirola, Málaga',
  deliveryRadiusLabel: 'Hasta 4 km',
  minimumOrderLabel: '€25',
};

export const historicalHomeOperationalFactsFixture: readonly HomeOperationalFactViewModel[] = [
  { label: 'Horario', value: '10:00–22:00' },
  { label: 'Alcohol', value: 'Entrega antes de 22:00' },
  { label: 'Área', value: 'Hasta 4 km' },
];

export const historicalHomeHeroImageFixture = asset('hero/cold-beer-hero.svg');
