import React from 'react';
import { Icon } from '../icons/Icon';
export function SearchField({ loading=false, disabled=false }: { loading?: boolean; disabled?: boolean }) {
  return <form className="hly-search" role="search" aria-label="Buscar en el catálogo">
    <label className="hly-visually-hidden" htmlFor="catalog-search">Busca productos, marcas o categorías</label>
    <Icon name="search" size={22}/>
    <input id="catalog-search" aria-label="Busca productos, marcas o categorías" type="search" placeholder={loading ? 'Cargando catálogo…' : 'Busca productos, marcas…'} disabled={disabled || loading} />
    <button type="button" className="hly-search__filter" aria-label="Abrir filtros" disabled={disabled || loading}><Icon name="filter" size={21}/></button>
  </form>;
}
