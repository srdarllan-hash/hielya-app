import { asset } from '../../lib/assets';

export const categories = [
  { label: 'Cervezas', image: asset('categories/victoria.svg') },
  { label: 'Destilados', image: asset('categories/whiskey.svg') },
  { label: 'Energéticos', image: asset('categories/redbull.svg') },
  { label: 'Hielo', image: asset('categories/ice-bag.svg') },
  { label: 'Refrescos', image: asset('categories/cocacola.svg') },
  { label: 'Snacks', image: asset('categories/lays.svg') },
];

export const products = [
  { name: 'Victoria Málaga', size: '330 ml', price: '€1,40', image: asset('products/victoria.svg') },
  { name: 'Estrella Galicia', size: '330 ml', price: '€1,50', image: asset('products/estrella.svg') },
  { name: 'Red Bull', size: '250 ml', price: '€2,80', image: asset('products/redbull.svg') },
  { name: 'Hielo en bolsa', size: '2 kg', price: '€3,50', image: asset('products/ice-bag.svg') },
];

export const packs = [
  {
    name: 'Pack Cervecero',
    description: ['12x Estrella Galicia 330 ml', 'Hielo en bolsa 2 kg'],
    price: '€16,80',
    discount: '−7%',
    image: asset('products/pack-cervecero.svg'),
  },
  {
    name: 'Mix Energía',
    description: ['6x Red Bull 250 ml', '6x Coca-Cola 330 ml'],
    price: '€15,90',
    discount: '−10%',
    image: asset('products/mix-energia.svg'),
  },
];

export const heroImage = asset('hero/cold-beer-hero.svg');
