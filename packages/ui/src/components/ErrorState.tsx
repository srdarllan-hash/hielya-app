import React from 'react';
import { Icon } from '../icons/Icon';
export function ErrorState({ title='No pudimos cargar la tienda', message='Revisa tu conexión e inténtalo de nuevo.', action='Reintentar' }: { title?:string;message?:string;action?:string }) {
  return <main className="hly-feedback-state" role="alert"><span className="hly-feedback-state__icon"><Icon name="wifi-off" size={38}/></span><h1>{title}</h1><p>{message}</p><button type="button"><Icon name="refresh" size={20}/>{action}</button></main>;
}
