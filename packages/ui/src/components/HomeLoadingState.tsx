import React from 'react';

export function HomeLoadingState() {
  return (
    <main className="hly-home hly-home--loading" aria-busy="true" aria-live="polite">
      <h1 className="hly-visually-hidden">Inicio HIELYA</h1>
      <span className="hly-visually-hidden">Cargando la tienda HIELYA</span>
      <div className="hly-skeleton hly-skeleton--delivery" />
      <div className="hly-skeleton hly-skeleton--search" />
      <div className="hly-skeleton-row">{[1, 2, 3, 4, 5].map((item) => <span key={item} className="hly-skeleton hly-skeleton--circle" />)}</div>
      <div className="hly-skeleton hly-skeleton--hero" />
      <div className="hly-skeleton-row">{[1, 2, 3, 4].map((item) => <span key={item} className="hly-skeleton hly-skeleton--product" />)}</div>
    </main>
  );
}
