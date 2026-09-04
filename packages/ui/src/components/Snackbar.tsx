import React from 'react';
import { Icon } from '../icons/Icon';
export function Snackbar({ message, tone='info' }: { message:string;tone?:'info'|'warning'|'success' }) {
  return <div className={`hly-snackbar hly-snackbar--${tone}`} role="status" aria-live="polite"><Icon name={tone==='warning'?'warning':'bag'} size={19}/><span>{message}</span></div>;
}
