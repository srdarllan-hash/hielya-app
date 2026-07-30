import React from 'react';
import { Icon } from '../icons/Icon';
export function EmptyState({ title, message, action }: { title:string;message:string;action:string }) {
  return <section className="hly-feedback-state"><span className="hly-feedback-state__icon"><Icon name="bag" size={38}/></span><h2>{title}</h2><p>{message}</p><button type="button">{action}</button></section>;
}
